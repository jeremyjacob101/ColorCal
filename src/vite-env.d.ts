/// <reference types="vite/client" />
import type { CalendarEvent, CalendarPref } from "./types/colorcal";

declare global {
  interface Window {
    colorcal: {
      listCalendars: () => Promise<CalendarPref[]>;
      saveCalendars: (prefs: CalendarPref[]) => Promise<boolean>;
      eventsByDay: (args: {
        startMs: number;
        endMs: number;
      }) => Promise<Record<string, string[]>>;
      eventsForDay: (args: { dayMs: number }) => Promise<CalendarEvent[]>;
    };
  }
}

export {};
