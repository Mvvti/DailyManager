import { OAuth2Client } from "google-auth-library";
import { app, shell } from "electron";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_PORT = Number(process.env.GOOGLE_REDIRECT_PORT ?? "42813");
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${REDIRECT_PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const TOKEN_PATH = path.join(app.getPath("userData"), "google_tokens.json");

export function createOAuth2Client(): OAuth2Client {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment."
    );
  }
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function loadTokens(client: OAuth2Client): boolean {
  try {
    if (!fs.existsSync(TOKEN_PATH)) {
      return false;
    }

    const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    client.setCredentials(parsed);
    return true;
  } catch {
    return false;
  }
}

export function saveTokens(client: OAuth2Client): void {
  const creds = client.credentials ?? {};
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(creds, null, 2), "utf-8");
}

export async function runAuthFlow(client: OAuth2Client): Promise<void> {
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });

  await new Promise<void>((resolve, reject) => {
    let done = false;

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      fn();
    };

    const timeoutId = setTimeout(() => {
      finish(() => {
        server.close();
        reject(new Error("OAuth timeout"));
      });
    }, 120000);

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url ?? "/", REDIRECT_URI);
        const code = reqUrl.searchParams.get("code");

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Brak kodu autoryzacji.");
          return;
        }

        const tokenResponse = await client.getToken(code);
        if (!tokenResponse.tokens) {
          throw new Error("No tokens in auth response");
        }

        client.setCredentials(tokenResponse.tokens);
        saveTokens(client);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<html><body><h2>Autoryzacja zakończona. Możesz zamknąć to okno.</h2></body></html>");

        finish(() => {
          clearTimeout(timeoutId);
          server.close();
          resolve();
        });
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Błąd autoryzacji.");

        finish(() => {
          clearTimeout(timeoutId);
          server.close();
          reject(error instanceof Error ? error : new Error("Auth flow failed"));
        });
      }
    });

    server.listen(REDIRECT_PORT, "127.0.0.1", () => {
      void shell.openExternal(authUrl);
    });

    server.on("error", (error) => {
      finish(() => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  });
}
