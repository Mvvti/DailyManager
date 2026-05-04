import { useEffect, useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

type EventGroup = { label: string; dateKey: string; events: CalendarEvent[] };
type AuthState = "idle" | "loading" | "authenticated" | "error";

function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [authState, setAuthState] = useState<AuthState>("idle");

  const groupedEvents = useMemo((): EventGroup[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayKey = today.toDateString();
    const tomorrowKey = tomorrow.toDateString();

    const groups: EventGroup[] = [];

    for (const event of events) {
      const eventDate = new Date(event.start);
      const dateKey = eventDate.toDateString();

      let label: string;
      if (dateKey === todayKey) label = "Dziś";
      else if (dateKey === tomorrowKey) label = "Jutro";
      else label = eventDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });

      const existing = groups.find((g) => g.dateKey === dateKey);
      if (existing) existing.events.push(event);
      else groups.push({ label, dateKey, events: [event] });
    }

    return groups;
  }, [events]);

  const loadEvents = async () => {
    try {
      const response = await window.electronAPI?.getCalendarEvents?.();
      if (!response) {
        setAuthState("error");
        return;
      }

      if ("error" in response) {
        if (response.error === "not_authenticated") {
          setAuthState("idle");
          setEvents([]);
          return;
        }

        setAuthState("error");
        return;
      }

      setEvents(response.events ?? []);
      setAuthState("authenticated");
    } catch {
      setAuthState("error");
    }
  };

  useEffect(() => {
    void loadEvents();

    const intervalId = window.setInterval(() => {
      void loadEvents();
    }, 5 * 60 * 1000);

    const handleExternalCreate = () => {
      void loadEvents();
    };

    window.addEventListener("calendar-event-created", handleExternalCreate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("calendar-event-created", handleExternalCreate);
    };
  }, []);

  const handleAuth = async () => {
    try {
      setAuthState("loading");
      await window.electronAPI?.authGoogle?.();
      await loadEvents();
    } catch {
      setAuthState("error");
    }
  };

  const formatTime = (event: CalendarEvent): string => {
    if (event.allDay) return "Cały dzień";
    const date = new Date(event.start);
    return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.12em] text-white/35">Kalendarz</h2>
        <span className="text-[10px] text-white/25">7 dni</span>
      </div>

      {authState === "idle" && (
        <button
          type="button"
          onClick={handleAuth}
          className="rounded-lg border border-violet-500/30 bg-violet-500/20 px-3 py-2 text-sm text-violet-200 transition-all hover:bg-violet-500/30"
        >
          Połącz z Google
        </button>
      )}

      {authState === "loading" && <p className="text-sm text-white/40">Łączenie…</p>}

      {authState === "authenticated" && events.length === 0 && (
        <p className="text-sm text-white/30">Brak wydarzeń w tym tygodniu</p>
      )}

      {authState === "authenticated" && events.length > 0 && (
        <div className="space-y-3">
          {groupedEvents.map((group) => (
            <div key={group.dateKey}>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/35">{group.label}</p>
              <ul className="space-y-1.5">
                {group.events.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5 rounded-lg bg-white/5 px-3 py-2">
                    <span className="mt-0.5 min-w-[36px] text-xs text-white/35">{formatTime(event)}</span>
                    <span className="text-sm text-white/75">{event.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {authState === "error" && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/40">Błąd połączenia</p>
          <button
            type="button"
            onClick={() => void loadEvents()}
            className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/60 hover:text-white/85"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
    </section>
  );
}

export default Calendar;
