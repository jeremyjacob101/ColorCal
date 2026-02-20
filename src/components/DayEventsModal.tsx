import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import type { CalendarEvent, CalendarPref } from "../types/colorcal";

type Props = {
  day: Date;
  calendars: CalendarPref[];
  onClose: () => void;
};

function fmtTimeRange(event: CalendarEvent, day: Date): string {
  if (event.isAllDay) return "All-day";

  const start = new Date(event.startMs);
  const end = new Date(event.endMs);
  const startText = isSameDay(start, day)
    ? format(start, "h:mm a")
    : `Starts ${format(start, "EEE h:mm a")}`;
  const endText = isSameDay(end, day)
    ? format(end, "h:mm a")
    : `Ends ${format(end, "EEE h:mm a")}`;

  return `${startText} - ${endText}`;
}

export function DayEventsModal({ day, calendars, onClose }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of calendars) map.set(c.id, c.color);
    return map;
  }, [calendars]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    window.colorcal
      .eventsForDay({ dayMs: day.getTime() })
      .then((next) => {
        if (!cancelled) setEvents(next);
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
          setError("Unable to load events for this day.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [day]);

  const sorted = useMemo(() => {
    const byTitle = (a: CalendarEvent, b: CalendarEvent) =>
      a.title.localeCompare(b.title);

    const allDay = events.filter((e) => e.isAllDay).sort(byTitle);
    const timed = events
      .filter((e) => !e.isAllDay)
      .sort(
        (a, b) =>
          a.startMs - b.startMs ||
          a.endMs - b.endMs ||
          a.title.localeCompare(b.title),
      );
    return [...allDay, ...timed];
  }, [events]);

  return (
    <>
      <button
        type="button"
        className="dayEventsBackdrop"
        onClick={onClose}
        aria-label="Close day events"
      />
      <div className="dayEventsLayer" role="dialog" aria-modal="true">
        <section className="dayEventsModal">
          <header className="dayEventsHeader">
            <h2 className="dayEventsTitle">{format(day, "EEEE, MMMM d, yyyy")}</h2>
            <button
              type="button"
              className="btn dayEventsCloseBtn"
              onClick={onClose}
            >
              Close
            </button>
          </header>

          <div className="dayEventsBody">
            {loading && <div className="dayEventsState">Loading events...</div>}
            {!loading && error && <div className="dayEventsState">{error}</div>}
            {!loading && !error && sorted.length === 0 && (
              <div className="dayEventsState">No events.</div>
            )}

            {!loading && !error && sorted.length > 0 && (
              <ul className="dayEventsList">
                {sorted.map((event) => (
                  <li key={`${event.id}-${event.startMs}`} className="dayEventsItem">
                    <span
                      className="dayEventsColor"
                      style={{ background: colorById.get(event.calendarId) ?? "#3b82f6" }}
                      aria-hidden="true"
                    />
                    <div className="dayEventsInfo">
                      <div className="dayEventsName">{event.title}</div>
                      <div className="dayEventsMeta">
                        {fmtTimeRange(event, day)} · {event.calendarName}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
