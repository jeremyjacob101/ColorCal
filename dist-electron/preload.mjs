"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("colorcal", {
  listCalendars: () => electron.ipcRenderer.invoke("calendars:list"),
  saveCalendars: (prefs) => electron.ipcRenderer.invoke("calendars:save", prefs),
  eventsByDay: (args) => electron.ipcRenderer.invoke("events:byDay", args),
  eventsForDay: (args) => electron.ipcRenderer.invoke("events:forDay", args)
});
