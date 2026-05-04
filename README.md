# DailyManager

Mały desktopowy panel do ogarniania dnia: zadania, kalendarz Google, szybkie linki, notatka i pogoda.

Zrobione w: Electron + Vite + React + TypeScript.

## Jak odpalić lokalnie

1. Zainstaluj paczki:

```bash
npm install
```

2. Skopiuj plik env:

```bash
cp .env.example .env
```

3. Uzupełnij w `.env` dane Google OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Opcjonalnie możesz zmienić:
- `GOOGLE_REDIRECT_PORT` (domyślnie `42813`)
- `GOOGLE_REDIRECT_URI` (domyślnie `http://localhost:42813`)

4. Uruchom apkę:

```bash
npm run dev
```

## Build instalatora

```bash
npm run build
```

Instalator pojawi się w folderze `release/`.

## Ważne

- `.env` jest lokalny i nie powinien trafiać do repo.
- Tokeny Google zapisują się lokalnie w `userData/google_tokens.json`.

## Co już działa

- zegar + data
- lista zadań (kategorie, priorytety, podzadania)
- deadline z NLP (np. „jutro 14:00”)
- integracja z Google Calendar (dodawanie/usuwanie eventów z tasków)
- notatka dnia
- quick links
- tray + autostart
