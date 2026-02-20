import { useEffect, useState } from "react";
import "./styles.css";
import type { CalendarPref } from "./types/colorcal";
import { SixWeekGrid } from "./components/SixWeekGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { DayEventsModal } from "./components/DayEventsModal";

export default function App() {
  const [calendars, setCalendars] = useState<CalendarPref[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    window.colorcal
      .listCalendars()
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedDay) {
        setSelectedDay(null);
        return;
      }
      if (showSettings) setShowSettings(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDay, showSettings]);

  return (
    <div className="shell">
      <SixWeekGrid
        calendars={calendars}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        onDayClick={setSelectedDay}
      />

      {showSettings && (
        <>
          <button
            type="button"
            className="settingsBackdrop"
            onClick={() => setShowSettings(false)}
            aria-label="Close settings"
          />
          <div
            className="settingsPopup"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
          >
            <SettingsPanel calendars={calendars} onChange={setCalendars} />
          </div>
        </>
      )}

      {selectedDay && (
        <DayEventsModal
          day={selectedDay}
          calendars={calendars}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
