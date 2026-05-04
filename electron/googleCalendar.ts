import { calendar_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: string;
};

const mapEvents = (items: calendar_v3.Schema$Event[]): CalendarEvent[] => {
  return items
    .map((event: calendar_v3.Schema$Event) => {
      const start = event.start?.dateTime ?? event.start?.date ?? "";
      const end = event.end?.dateTime ?? event.end?.date ?? "";
      const allDay = Boolean(event.start?.date && !event.start?.dateTime);

      return {
        id: event.id ?? crypto.randomUUID(),
        summary: event.summary ?? "(bez tytułu)",
        start,
        end,
        allDay,
        color: event.colorId ?? undefined
      };
    })
    .filter((event: CalendarEvent) => event.start && event.end)
    .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 50);
};

export async function fetchTodayEvents(client: OAuth2Client): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: "v3", auth: client });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  const fetchOnce = async () => {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWeek.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50
    });

    return mapEvents(response.data.items ?? []);
  };

  try {
    return await fetchOnce();
  } catch (error) {
    const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
    if (status === 401) {
      await client.refreshAccessToken();
      return await fetchOnce();
    }
    throw error;
  }
}

export async function createCalendarEvent(
  client: OAuth2Client,
  title: string,
  deadline: string
): Promise<{ id: string } | { error: string }> {
  const calendar = google.calendar({ version: "v3", auth: client });
  const startDate = new Date(deadline);

  if (Number.isNaN(startDate.getTime())) {
    return { error: "invalid_deadline" };
  }

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  const createOnce = async () => {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: "Europe/Warsaw"
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: "Europe/Warsaw"
        }
      }
    });

    if (!response.data.id) {
      return { error: "missing_event_id" } as const;
    }

    return { id: response.data.id };
  };

  try {
    return await createOnce();
  } catch (error) {
    const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
    if (status === 401) {
      try {
        await client.refreshAccessToken();
        return await createOnce();
      } catch (retryError) {
        return { error: String(retryError) };
      }
    }
    return { error: String(error) };
  }
}

export async function deleteCalendarEvent(
  client: OAuth2Client,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const calendar = google.calendar({ version: "v3", auth: client });

  const deleteOnce = async () => {
    await calendar.events.delete({
      calendarId: "primary",
      eventId
    });
    return { success: true } as const;
  };

  try {
    return await deleteOnce();
  } catch (error) {
    const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;

    if (status === 404 || status === 410) {
      return { success: true };
    }

    if (status === 401) {
      try {
        await client.refreshAccessToken();
        return await deleteOnce();
      } catch (retryError) {
        const retryStatus =
          (retryError as { code?: number; status?: number }).code ??
          (retryError as { status?: number }).status;
        if (retryStatus === 404 || retryStatus === 410) {
          return { success: true };
        }
        return { success: false, error: String(retryError) };
      }
    }

    return { success: false, error: String(error) };
  }
}
