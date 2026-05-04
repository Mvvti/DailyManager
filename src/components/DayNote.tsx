import { useEffect, useMemo, useState } from "react";

const dayKeyFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const storageKeyFromDay = (dayKey: string): string => `dm_note_${dayKey}`;

function DayNote() {
  const [dayKey, setDayKey] = useState<string>(() => dayKeyFromDate(new Date()));
  const [text, setText] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  const storageKey = useMemo(() => storageKeyFromDay(dayKey), [dayKey]);

  useEffect(() => {
    const savedNote = window.localStorage.getItem(storageKey);
    setText(savedNote ?? "");
    setSaved(false);
  }, [storageKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, text);
      setSaved(true);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [storageKey, text]);

  useEffect(() => {
    if (saved) {
      const timeoutId = window.setTimeout(() => {
        setSaved(false);
      }, 1200);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [saved]);

  useEffect(() => {
    let timeoutId: number;

    const scheduleNextDayCheck = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const delay = Math.max(1, nextMidnight.getTime() - now.getTime());

      timeoutId = window.setTimeout(() => {
        setDayKey(dayKeyFromDate(new Date()));
        scheduleNextDayCheck();
      }, delay);
    };

    scheduleNextDayCheck();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const onChange = (value: string) => {
    setSaved(false);
    setText(value);
  };

  return (
    <section className="px-4 py-4 pb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.12em] text-white/35">Notatka dnia</h2>
        <span className={`text-[10px] text-violet-300/60 transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
          Zapisano ✓
        </span>
      </div>
      <textarea
        className="w-full min-h-[100px] resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white/75 outline-none transition-all placeholder:text-white/25 focus:border-violet-500/30 focus:bg-white/8"
        placeholder="Co jest dziś ważne?"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}

export default DayNote;
