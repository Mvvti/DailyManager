import { app, BrowserWindow, screen, Tray, ipcMain, shell, net } from "electron";
import path from "node:path";
import { createTray } from "./tray";
import { createOAuth2Client, loadTokens, runAuthFlow, saveTokens } from "./googleAuth";
import { createCalendarEvent, deleteCalendarEvent, fetchTodayEvents } from "./googleCalendar";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const oauth2Client = createOAuth2Client();
loadTokens(oauth2Client);
let isQuitting = false;

const resizeToContentHeight = async (window: BrowserWindow): Promise<void> => {
  const display = screen.getPrimaryDisplay();
  const { height: maxHeight } = display.workAreaSize;

  try {
    const height = await window.webContents.executeJavaScript(
      "(() => { const appRoot = document.querySelector('#root > div'); return appRoot ? Math.ceil(appRoot.getBoundingClientRect().height) : Math.ceil(document.body.getBoundingClientRect().height); })()",
      true
    );

    if (typeof height !== "number" || Number.isNaN(height)) return;

    const newHeight = Math.min(Math.max(Math.ceil(height), 1), maxHeight);
    window.setSize(320, newHeight);
  } catch {
    // Ignore transient script-evaluation errors during page transitions.
  }
};

const createWindow = (): BrowserWindow => {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth } = display.workAreaSize;

  const window = new BrowserWindow({
    width: 320,
    height: 600,
    x: screenWidth - 320,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });

  if (isDev) {
    void window.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    void window.loadFile(indexPath);
  }

  window.webContents.on("did-finish-load", () => {
    if (!window.isVisible()) window.show();
    window.focus();
    void resizeToContentHeight(window);
  });

  window.webContents.on("dom-ready", () => {
    void resizeToContentHeight(window);
  });

  setTimeout(() => {
    if (!window.isDestroyed() && !window.isVisible()) {
      window.show();
      window.focus();
    }
  }, 2000);

  return window;
};

app.whenReady().then(() => {
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true });
  }

  mainWindow = createWindow();
  tray = createTray(mainWindow);

  ipcMain.on("resize-window", (_event, height: number) => {
    if (!mainWindow) return;
    const display = screen.getPrimaryDisplay();
    const { height: maxHeight } = display.workAreaSize;
    const newHeight = Math.min(Math.max(height, 1), maxHeight);
    mainWindow.setSize(320, newHeight);
  });

  ipcMain.handle("google-auth", async () => {
    await runAuthFlow(oauth2Client);
    saveTokens(oauth2Client);
    return { success: true };
  });

  ipcMain.handle("get-calendar-events", async () => {
    try {
      if (!oauth2Client.credentials?.access_token) return { error: "not_authenticated" };
      const events = await fetchTodayEvents(oauth2Client);
      saveTokens(oauth2Client);
      return { events };
    } catch {
      return { error: "fetch_failed" };
    }
  });

  ipcMain.handle("create-calendar-event", async (_event, title: string, deadline: string) => {
    try {
      if (!oauth2Client.credentials?.access_token) {
        return { success: false, error: "not_authenticated" };
      }

      let result = await createCalendarEvent(oauth2Client, title, deadline);
      if ("error" in result && /insufficient|permission|scope/i.test(result.error)) {
        await runAuthFlow(oauth2Client);
        saveTokens(oauth2Client);
        result = await createCalendarEvent(oauth2Client, title, deadline);
      }

      saveTokens(oauth2Client);

      if ("error" in result) {
        return { success: false, error: result.error };
      }

      return { success: true, id: result.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("delete-calendar-event", async (_event, eventId: string) => {
    try {
      if (!oauth2Client.credentials?.access_token) {
        return { success: false, error: "not_authenticated" };
      }

      const result = await deleteCalendarEvent(oauth2Client, eventId);
      saveTokens(oauth2Client);
      return result;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("open-external", async (_event, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });

  ipcMain.handle("get-weather", async () => {
    try {
      const geoRes = await net.fetch("http://ip-api.com/json/?fields=status,lat,lon,city");
      if (!geoRes.ok) throw new Error(`geo failed: ${geoRes.status}`);
      const geo = (await geoRes.json()) as { status?: string; lat?: number; lon?: number; city?: string };
      if (geo.status !== "success" || typeof geo.lat !== "number" || typeof geo.lon !== "number" || typeof geo.city !== "string") {
        throw new Error("invalid geo response");
      }

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weathercode,windspeed_10m`;
      const weatherRes = await net.fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error(`weather failed: ${weatherRes.status}`);
      const weather = (await weatherRes.json()) as { current?: { temperature_2m?: number; weathercode?: number; windspeed_10m?: number } };
      const cur = weather.current;
      if (!cur || typeof cur.temperature_2m !== "number" || typeof cur.weathercode !== "number" || typeof cur.windspeed_10m !== "number") {
        throw new Error("invalid weather response");
      }

      return { city: geo.city, temperature: cur.temperature_2m, weatherCode: cur.weathercode, windSpeed: cur.windspeed_10m };
    } catch (err) {
      return { error: String(err) };
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = createWindow();
      tray = createTray(mainWindow);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on("window-all-closed", () => {
  // Keep the app alive in tray when windows are closed/hidden.
});
