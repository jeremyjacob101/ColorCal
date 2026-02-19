import Store from "electron-store";

export type CalendarPref = {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
};

type SettingsShape = {
  calendars: CalendarPref[];
};

export const store = new Store<SettingsShape>({
  name: "colorcal",
  defaults: { calendars: [] },
});
