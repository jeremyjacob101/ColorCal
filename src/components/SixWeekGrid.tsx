import { useEffect, useMemo, useRef, useState } from "react";
import { CircleUserRound, Settings } from "lucide-react";
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

type Props = {
  calendars: CalendarPref[];
  showSettings: boolean;
  onToggleSettings: () => void;
  onDayClick: (day: Date) => void;
};

export function SixWeekGrid({
  calendars,
  showSettings,
  onToggleSettings,
  onDayClick,
}: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [byDay, setByDay] = useState<Record<string, string[]>>({});
  const swipeAccumRef = useRef(0);
  const swipeCooldownUntilRef = useRef(0);

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
  const goPrevMonth = () => setMonth((m) => addMonths(m, -1));
  const goNextMonth = () => setMonth((m) => addMonths(m, 1));

  const handleMonthSwipe = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaX) < 2) return;

    e.preventDefault();
    const now = Date.now();
    if (now < swipeCooldownUntilRef.current) return;

    if (Math.sign(swipeAccumRef.current) !== Math.sign(e.deltaX)) {
      swipeAccumRef.current = 0;
    }
    swipeAccumRef.current += e.deltaX;

    if (Math.abs(swipeAccumRef.current) < 38) return;

    if (swipeAccumRef.current > 0) goNextMonth();
    else goPrevMonth();

    swipeAccumRef.current = 0;
    swipeCooldownUntilRef.current = now + 320;
  };

  return (
    <div className="calendarView" onWheel={handleMonthSwipe}>
      <div className="headerRow">
        <div className="headerSideSlot" aria-hidden="true">
          <CircleUserRound size={14} strokeWidth={2} />
        </div>

        <div className="headerCenter">
          <div className="title">{format(month, "MMMM yyyy")}</div>
        </div>

        <button
          type="button"
          className="btn headerSideBtn headerSettingsBtn"
          onClick={onToggleSettings}
          style={{ opacity: showSettings ? 1 : 0.6 }}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="grid">
        {gridDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const calIds = byDay[key] ?? [];
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);

          return (
            <div
              key={key}
              className="cell"
              title={key}
              onClick={() => onDayClick(d)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onDayClick(d);
              }}
            >
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
