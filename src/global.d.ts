type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

declare global {
  interface Window {
    electronAPI?: {
      resizeWindow: (height: number) => void;
      authGoogle: () => Promise<{ success: boolean }>;
      getCalendarEvents: () => Promise<{ events?: CalendarEvent[] } | { error: string }>;
      createCalendarEvent: (
        title: string,
        deadline: string
      ) => Promise<{ success: boolean; id?: string; error?: string }>;
      deleteCalendarEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
      openExternal: (url: string) => Promise<void>;
      getWeather: () => Promise<{ city: string; temperature: number; weatherCode: number; windSpeed: number } | { error: string }>;
    };
  }
}

export {};
