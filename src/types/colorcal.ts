export type CalendarPref = {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startMs: number;
  endMs: number;
  isAllDay: boolean;
  calendarId: string;
  calendarName: string;
};
