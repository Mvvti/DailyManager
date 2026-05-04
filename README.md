# DailyManager

Electron + Vite + React + TypeScript desktop sidebar.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set Google OAuth credentials:

```bash
cp .env.example .env
```

Required keys:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional:
- `GOOGLE_REDIRECT_PORT` (default `42813`)
- `GOOGLE_REDIRECT_URI` (default `http://localhost:<port>`)

3. Run app:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Security

- Never commit `.env`.
- Google OAuth tokens are stored in Electron `userData` (`google_tokens.json`), not in the repository.
