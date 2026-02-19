import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarPref } from "../types/colorcal";

type Props = { calendars: CalendarPref[] };

export function SixWeekGrid({ calendars }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [byDay, setByDay] = useState<Record<string, string[]>>({});

  const enabledCount = useMemo(
    () => calendars.filter((c) => c.enabled).length,
    [calendars],
  );

  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of calendars) m.set(c.id, c.color);
    return m;
  }, [calendars]);

  // Sunday-start grid. If you want Monday-start later, we’ll add a setting.
  const gridStart = useMemo(
    () => startOfWeek(month, { weekStartsOn: 0 }),
    [month],
  );

  const gridDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  useEffect(() => {
    const startMs = gridStart.getTime();
    const endMs = addDays(gridStart, 42).getTime();

    window.colorcal
      .eventsByDay({ startMs, endMs })
      .then(setByDay)
      .catch(() => setByDay({}));
  }, [gridStart, enabledCount]);

  const today = new Date();

  return (
    <div className="calendarView">
      <div className="headerRow">
        <button
          className="btn navBtn navPrev"
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          ◀
        </button>

        <div className="title">{format(month, "MMMM yyyy")}</div>

        <button
          className="btn navBtn navNext"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          ▶
        </button>
      </div>

      <div className="grid">
        {gridDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const calIds = byDay[key] ?? [];
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);

          return (
            <div key={key} className="cell" title={key}>
              <div
                className={[
                  "daynum",
                  inMonth ? "inMonth" : "outMonth",
                  isToday ? "today" : "",
                ].join(" ")}
              >
                {format(d, "d")}
              </div>

              <div className="dots">
                {calIds.map((id) => (
                  <span
                    key={id}
                    className="dot"
                    style={{ background: colorById.get(id) ?? "#fff" }}
                    title={calendars.find((c) => c.id === id)?.name ?? ""}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
