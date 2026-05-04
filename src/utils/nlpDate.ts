export function parseNaturalDate(input: string): { text: string; deadline: Date | null } {
  const original = input;
  let text = input;
  const now = new Date();

  const dayNames = ["niedzielę", "poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę"] as const;
  const dayMap: Record<string, number> = {
    poniedziałek: 1,
    wtorek: 2,
    "środę": 3,
    czwartek: 4,
    piątek: 5,
    sobotę: 6,
    niedzielę: 0
  };

  const relativeMinutesRegex = /\bza\s+(\d+)\s*(?:min(?:ut(?:y|ę)?)?\b)/i;
  const relativeHoursRegex = /\bza\s+(\d+)\s*(?:godzin(?:y|ę)?|h)\b/i;

  const clockHmRegex = /\bo?\s*(\d{1,2}):(\d{2})\b/i;
  const clockHourRegex = /\bo?\s*(\d{1,2})\s*(?:h|g\.?|godz\.?)\b/i;

  const dayRelativeRegexes = [
    { regex: /\bpojutrze\b/i, add: 2 },
    { regex: /\bjutro\b/i, add: 1 },
    { regex: /\bdziś\b|\bdzisiaj\b/i, add: 0 }
  ] as const;

  const weekdayRegex = /\bw\s+(poniedziałek|wtorek|środę|czwartek|piątek|sobotę|niedzielę)\b/i;

  const strip = (value: string): string => {
    return value
      .replace(/[\s,]+/g, " ")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
  };

  const setTime = (base: Date, hours: number, minutes: number): Date => {
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    return next;
  };

  const relativeMinutes = relativeMinutesRegex.exec(text);
  if (relativeMinutes) {
    const minutes = Number(relativeMinutes[1]);
    const deadline = new Date(now.getTime() + minutes * 60 * 1000);
    text = text.replace(relativeMinutes[0], " ");
    const cleaned = strip(text);
    return { text: cleaned || original, deadline };
  }

  const relativeHours = relativeHoursRegex.exec(text);
  if (relativeHours) {
    const hours = Number(relativeHours[1]);
    const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
    text = text.replace(relativeHours[0], " ");
    const cleaned = strip(text);
    return { text: cleaned || original, deadline };
  }

  let foundHours: number | null = null;
  let foundMinutes: number | null = null;

  const hmMatch = clockHmRegex.exec(text);
  if (hmMatch) {
    foundHours = Number(hmMatch[1]);
    foundMinutes = Number(hmMatch[2]);
    text = text.replace(hmMatch[0], " ");
  } else {
    const hMatch = clockHourRegex.exec(text);
    if (hMatch) {
      foundHours = Number(hMatch[1]);
      foundMinutes = 0;
      text = text.replace(hMatch[0], " ");
    }
  }

  let dayDate: Date | null = null;

  for (const item of dayRelativeRegexes) {
    const match = item.regex.exec(text);
    if (match) {
      dayDate = new Date(now);
      dayDate.setHours(0, 0, 0, 0);
      dayDate.setDate(dayDate.getDate() + item.add);
      text = text.replace(match[0], " ");
      break;
    }
  }

  if (!dayDate) {
    const weekdayMatch = weekdayRegex.exec(text);
    if (weekdayMatch) {
      const label = weekdayMatch[1].toLowerCase();
      const targetDay = dayMap[label];
      if (targetDay !== undefined) {
        dayDate = new Date(now);
        dayDate.setHours(0, 0, 0, 0);
        const currentDay = dayDate.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        dayDate.setDate(dayDate.getDate() + diff);
      }
      text = text.replace(weekdayMatch[0], " ");
    }
  }

  let deadline: Date | null = null;

  if (dayDate && foundHours !== null && foundMinutes !== null) {
    deadline = setTime(dayDate, foundHours, foundMinutes);
  } else if (dayDate) {
    deadline = setTime(dayDate, 23, 59);
  } else if (foundHours !== null && foundMinutes !== null) {
    const candidate = setTime(now, foundHours, foundMinutes);
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    deadline = candidate;
  }

  const cleaned = strip(text);
  return { text: cleaned || original, deadline };
}

// "jutro 14:00 call z Tomkiem" → { text: "call z Tomkiem", deadline: tomorrow 14:00 }
// "w piątek spotkanie z klientem" → { text: "spotkanie z klientem", deadline: next Friday 23:59 }
// "dziś o 16 zadzwoń do mamy" → { text: "zadzwoń do mamy", deadline: today 16:00 }
// "za 30 minut przerwa" → { text: "przerwa", deadline: now + 30min }
// "napisz raport" → { text: "napisz raport", deadline: null }