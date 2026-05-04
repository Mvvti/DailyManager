# DailyManager — Postęp projektu

## Etap 1 — Inicjalizacja projektu
- Status: ✅ ukończony
- Co zostało zrobione: Szkielet Electron+Vite+React+TS+Tailwind; okno 320px po prawej, frameless, alwaysOnTop, skipTaskbar
- Pliki zmienione: package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js, electron/main.ts, electron/preload.ts, src/main.tsx, src/App.tsx, src/index.css, index.html
- Następny etap: Zegar + data

## Etap 2 — Zegar + data
- Status: ✅ ukończony
- Co zostało zrobione: Komponent Clock z HH:MM:SS (setInterval/cleanup), data po polsku (pl-PL locale)
- Pliki zmienione: src/components/Clock.tsx (nowy), src/App.tsx
- Następny etap: Lista zadań

## Etap 3 — Lista zadań
- Status: ✅ ukończony
- Co zostało zrobione: TaskList z dodawaniem/odhaczaniem/usuwaniem, persystencja localStorage z walidacją type guard
- Pliki zmienione: src/components/TaskList.tsx (nowy), src/App.tsx
- Następny etap: Notatka dnia

## Etap 4 — Notatka dnia
- Status: ✅ ukończony
- Co zostało zrobione: DayNote z auto-save debounce 500ms, klucz per dzień (dm_note_YYYY-MM-DD), timer do północy, status "Zapisano"
- Pliki zmienione: src/components/DayNote.tsx (nowy), src/App.tsx
- Następny etap: Pogoda

## Etap 5 — Pogoda
- Status: ✅ ukończony
- Co zostało zrobione: Weather z ipapi.co + open-meteo, cache 30min w localStorage, fallback na cache przy błędzie sieci, mapowanie weathercode→emoji
- Pliki zmienione: src/components/Weather.tsx (nowy), src/App.tsx
- Następny etap: Autostart + Tray

## Etap 6 — Autostart + Tray
- Status: ✅ ukończony
- Co zostało zrobione: Tray z menu (Pokaż/Ukryj, Zamknij), chowanie okna zamiast zamykania (isQuitting flag), autostart przy starcie Windowsa (tylko build)
- Pliki zmienione: electron/tray.ts (nowy), electron/main.ts
- Następny etap: Testowanie i poprawki

## Etap 6.5 — Testowanie i poprawki
- Status: ✅ ukończony
- Naprawione: skrypt dev (brak kompilacji TS przed startem), ścieżka main w package.json, obcięte pliki main.ts i App.tsx, białe tło (height: 100% na html/body), dynamiczny resize okna przez IPC + ResizeObserver
- Pliki zmienione: package.json, electron/main.ts, electron/preload.ts, src/App.tsx, src/index.css, src/components/Clock.tsx

## Etap 8a — Drag handle + checkboxy
- Status: ✅ ukończony
- Co zostało zrobione: DragHandle z -webkit-app-region:drag, checkboxy w TaskList, usunięto setPosition() z resize handlera
- Pliki zmienione: src/components/DragHandle.tsx (nowy), src/App.tsx, src/components/TaskList.tsx, electron/main.ts

## Etap 8b — Kategorie zadań (Praca / Dom)
- Status: ✅ ukończony
- Co zostało zrobione: zakładki Praca/Dom, category w typie Task, migracja starych danych, sortowanie (nieukończone na górze)
- Pliki zmienione: src/components/TaskList.tsx

## Etap 8c — Animacje pogody
- Status: ✅ ukończony
- Co zostało zrobione: fade-in danych (opacity transition 700ms), gradient tła sekcji zależny od weathercode (transition 1000ms)
- Pliki zmienione: src/components/Weather.tsx

## Etap 8d — Animacje framer-motion
- Status: ✅ ukończony
- Co zostało zrobione: staggered fade-in sekcji, puls sekund w zegarze, slide-in/out zadań (AnimatePresence), whileTap na checkboxie
- Pliki zmienione: package.json, src/App.tsx, src/components/Clock.tsx, src/components/TaskList.tsx

## Etap 8e — Animowane tło pogody (cząsteczki)
- Status: ✅ ukończony
- Co zostało zrobione: WeatherParticles canvas z efektami: deszcz, śnieg, słońce, chmury, mgła, burza (rAF loop + cleanup)
- Pliki zmienione: src/components/WeatherParticles.tsx (nowy), src/components/Weather.tsx

## Etap 8f — Poprawki animacji pogody
- Status: ✅ ukończony
- Co zostało zrobione: tło sekcji pogody = kolor aplikacji (#1a1a2e), cząsteczki podbite — słońce z dyskiem + poświatą + promieniami (opacity 0.80-0.85), chmury 0.38, mgła 0.18-0.38
- Pliki zmienione: src/components/Weather.tsx, src/components/WeatherParticles.tsx

## Etap 8g — Szlif UI (opis pogody + liczniki zadań + scroll)
- Status: ✅ ukończony
- Co zostało zrobione: opis pogody słowny pod temperaturą (weatherDescription), liczniki ukończonych/wszystkich na zakładkach Praca/Dom, max-height + overflow-y-auto + scrollbar-thin na liście zadań, naprawa kodowania polskich znaków
- Pliki zmienione: src/components/Weather.tsx, src/components/TaskList.tsx

## Etap 7 — Build .exe (electron-builder)
- Status: ✅ ukończony
- Co zostało zrobione: konfiguracja electron-builder (NSIS, win.icon), ikona ICO+PNG 256x256 wygenerowana skryptem, `npm run build` przeszedł bez błędów
- Pliki zmienione: package.json, build/icon.ico (nowy), build/icon.png (nowy)
- Wynik: release/DailyManager Setup 1.0.0.exe + win-unpacked

## Etap 9 — Redesign glassmorphism
- Status: ✅ ukończony
- Co zostało zrobione: przezroczyste okno OS (transparent: true + backgroundMaterial: acrylic), szklane karty (.glass-card z backdrop-filter blur 24px), akcent fioletowy (#8b5cf6), nowe JSX wszystkich komponentów, font-thin w zegarze i pogodzie, SVG checkbox z ptaszkiem, violet zakładki
- Pliki zmienione: electron/main.ts, src/index.css, src/App.tsx, src/components/DragHandle.tsx, src/components/Clock.tsx, src/components/Weather.tsx, src/components/TaskList.tsx, src/components/DayNote.tsx
- Następny krok: npm run build → nowy installer .exe

## Etap 10 — Google Calendar
- Status: ✅ ukończony
- Co zostało zrobione: OAuth 2.0 flow z lokalnym serwerem HTTP, googleAuth.ts + googleCalendar.ts, IPC handlery, preload rozbudowany, komponent Calendar.tsx, tokeny w userData
- Pliki zmienione: electron/googleAuth.ts (nowy), electron/googleCalendar.ts (nowy), electron/main.ts, electron/preload.ts, src/components/Calendar.tsx (nowy), src/App.tsx

## Etap 11 — Priorytety zadań
- Status: ✅ ukończony
- Co zostało zrobione: pole priority (high/medium/low) w typie Task, migracja starych danych, wybór priorytetu w formularzu (🔴🟡🟢), kolorowa kropka na liście, sortowanie wg priorytetu
- Pliki zmienione: src/components/TaskList.tsx

## Etap 12 — Podzadania (subtaski)
- Status: ✅ ukończony
- Co zostało zrobione: typ Subtask, Task rozszerzony o subtasks[], migracja localStorage, stany expandedTaskId + newSubtaskTexts, funkcje toggleExpand/addSubtask/toggleSubtask/removeSubtask, animowane rozwijanie, badge postępu X/Y, formularz dodawania subtaska
- Pliki zmienione: src/components/TaskList.tsx

## Etap 13 — Szybkie linki
- Status: ✅ ukończony
- Co zostało zrobione: QuickLinks.tsx (siatka 3 kafelków, emoji+nazwa+url, tryb Edytuj/Gotowe, localStorage dm_quicklinks, domyślne linki GitHub/Gmail/YouTube, openExternal przez preload), favicony przez Google S2 API z fallbackiem na emoji, drag & drop kolejności w trybie edycji
- Pliki zmienione: src/components/QuickLinks.tsx (nowy), electron/preload.ts, src/App.tsx, src/global.d.ts

## Etap 14 — Poprawki UI
- Status: ✅ ukończony
- Co zostało zrobione: ukrycie scrollbara globalnie (*::-webkit-scrollbar display:none), neutralne tło kart glass-card (rgba biały zamiast fioletowego), zaokrąglony wrapper app-envelope, "Wiatr" przeniesiony pod opis pogody
- Pliki zmienione: src/index.css, src/components/Weather.tsx, src/App.tsx

## Etap 17 — Inline edytor deadline
- Status: ✅ ukończony
- Co zostało zrobione: kliknięcie badge 📅 otwiera inline input, Enter zapisuje, pusty=usuwa, Escape anuluje, onBlur zapisuje, "+ termin" na hover dla zadań bez terminu
- Pliki zmienione: src/components/TaskList.tsx

## Etap 15 — Natural language tasks
- Status: ✅ ukończony
- Co zostało zrobione: parser nlpDate.ts (dziś/jutro/pojutrze, dni tygodnia, HH:MM, za X minut/godzin), Task rozszerzony o deadline?, podgląd daty pod inputem (AnimatePresence), formatDeadlinePreview, getDeadlineStatus (overdue/today/future), kolorowy badge na zadaniu
- Pliki zmienione: src/utils/nlpDate.ts (nowy), src/components/TaskList.tsx

## Etap 16 — Kalendarz tygodniowy
- Status: ✅ ukończony
- Co zostało zrobione: zakres z 1 dnia na 7 dni (endOfWeek), maxResults 50, grupowanie eventów po dniach z nagłówkami Dziś/Jutro/nazwa dnia, wyrównany układ godzina+tytuł
- Pliki zmienione: electron/googleCalendar.ts, src/components/Calendar.tsx

## Etap Fix — Naprawa buildu .exe
- Status: ✅ ukończony
- Co zostało zrobione:
  - `base: './'` w vite.config.ts — absolutne ścieżki assetów → relatywne (konieczne dla file://)
  - Usunięto `backgroundMaterial: "acrylic"` — konflikt z transparent: true dawał szary prostokąt
  - `app.getAppPath()` zamiast `__dirname + "../../"` dla pewnej ścieżki do index.html
  - Pogoda przeniesiona do main process przez IPC (`net.fetch` zamiast `fetch` w rendererze)
  - Geo API zmienione z `ipapi.co` (blokuje Electron, 403) na `ip-api.com`
- Pliki zmienione: vite.config.ts, electron/main.ts, electron/preload.ts, src/global.d.ts, src/components/Weather.tsx

## Etap Fix2 — Naprawa kodowania znaków + próba poziomego layoutu
- Status: ✅ ukończony
- Co zostało zrobione:
  - Eksperyment z poziomym paskiem górnym (pełna szerokość, 100px) — ostatecznie odrzucony, powrót do pionowego panelu
  - Naprawiono uszkodzone kodowanie UTF-8 we wszystkich komponentach (Codex zapisał pliki w złym kodowaniu):
    - Weather.tsx: `°C`, emoji pogody (☀️⛅🌧️❄️⛈️), "Ładowanie pogody…"
    - TaskList.tsx: `dziś`, `📅`, 🔴🟡🟢, `×`, "Usuń", "Rozwiń", "Dodaj zadanie…", "Dodaj krok…"
    - QuickLinks.tsx: emoji domyślnych linków (🐙📧▶️), "Usuń link", `×`
    - DayNote.tsx: "Zapisano ✓", "Co jest dziś ważne?"
  - Błąd diagnostyczny: dodano wyświetlanie treści błędu pogody (tymczasowo) — usunięty po naprawie
- Pliki zmienione: src/components/Weather.tsx, src/components/TaskList.tsx, src/components/QuickLinks.tsx, src/components/DayNote.tsx, src/App.tsx, electron/main.ts

## Etap 19 — Usuwanie eventów Google Calendar przy usuwaniu zadania
- Status: ✅ ukończony
- Co zostało zrobione: deleteCalendarEvent w googleCalendar.ts (obsługa 401+retry, 404/410=sukces), IPC handler delete-calendar-event, bridge w preload, typ w global.d.ts, Task rozszerzony o calendarEventId? (persystuje w localStorage), usunięto stan calendarAdded (zastąpiony isInCalendar(task)), removeTask wywołuje deleteCalendarEvent fire-and-forget — dispatch odświeżenia kalendarza w .finally() (po potwierdzeniu przez Google), alert przy błędzie API
- Pliki zmienione: electron/googleCalendar.ts, electron/main.ts, electron/preload.ts, src/global.d.ts, src/components/TaskList.tsx

## Etap 18b — Auto-odświeżanie kalendarza po dodaniu eventu
- Status: ✅ ukończony
- Co zostało zrobione: TaskList dispatchuje CustomEvent "calendar-event-created" po sukcesie, Calendar nasłuchuje i natychmiast wywołuje loadEvents(), cleanup w useEffect
- Pliki zmienione: src/components/TaskList.tsx, src/components/Calendar.tsx

## Etap 18 — Tworzenie eventów Google Calendar z zadań
- Status: ✅ ukończony
- Co zostało zrobione: funkcja createCalendarEvent w googleCalendar.ts (summary, start, end+1h, timeZone=Europe/Warsaw, obsługa 401+retry), IPC handler create-calendar-event w main.ts, bridge w preload.ts, typowanie w global.d.ts, przycisk „+ 📅" przy zadaniach z deadline w TaskList.tsx (stan calendarAdded, po sukcesie zmiana na „✓" zielony disabled)
- Pliki zmienione: electron/googleCalendar.ts, electron/main.ts, electron/preload.ts, src/global.d.ts, src/components/TaskList.tsx
- Następny etap: —

## 🎉 PROJEKT AKTYWNY (v5)
- Ostatni build: release/DailyManager Setup 1.0.0.exe ✅ działa
- Stack: Electron 33 + Vite + React + TypeScript + Tailwind + framer-motion
- Layout: pionowy panel 320px, prawa strona ekranu, dynamiczna wysokość
- Sekcje: Clock | Weather (IPC) | QuickLinks | TaskList | Calendar | DayNote
