import { contextBridge, ipcRenderer } from "electron";
import type { CalendarPref } from "./settings";
import type { CalendarEvent } from "../src/types/colorcal";

contextBridge.exposeInMainWorld("colorcal", {
  listCalendars: (): Promise<CalendarPref[]> =>
    ipcRenderer.invoke("calendars:list"),
  saveCalendars: (prefs: CalendarPref[]): Promise<boolean> =>
    ipcRenderer.invoke("calendars:save", prefs),

  eventsByDay: (args: {
    startMs: number;
    endMs: number;
  }): Promise<Record<string, string[]>> =>
    ipcRenderer.invoke("events:byDay", args),

  eventsForDay: (args: { dayMs: number }): Promise<CalendarEvent[]> =>
    ipcRenderer.invoke("events:forDay", args),
});
