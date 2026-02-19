import { contextBridge, ipcRenderer } from "electron";
import type { CalendarPref } from "./settings";

contextBridge.exposeInMainWorld("colorcal", {
  listCalendars: (): Promise<CalendarPref[]> =>
    ipcRenderer.invoke("calendars:list"),
  saveCalendars: (prefs: CalendarPref[]): Promise<boolean> =>
    ipcRenderer.invoke("calendars:save", prefs),

  eventsByDay: (args: {
    startMs: number;
    endMs: number;
  }): Promise<Record<string, number[]>> =>
    ipcRenderer.invoke("events:byDay", args),
});
