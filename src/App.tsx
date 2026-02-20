import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import "./styles.css";
import type { CalendarPref } from "./types/colorcal";
import { SixWeekGrid } from "./components/SixWeekGrid";
import { SettingsPanel } from "./components/SettingsPanel";

export default function App() {
  const [calendars, setCalendars] = useState<CalendarPref[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    window.colorcal
      .listCalendars()
      .then(setCalendars)
      .catch(() => setCalendars([]));
  }, []);

  useEffect(() => {
    if (!showSettings) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSettings(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings]);

  return (
    <div className="shell">
      <div className="topbar">
        <button
          className="btn"
          onClick={() => setShowSettings(false)}
          style={{ opacity: showSettings ? 0.6 : 1 }}
        >
          Calendar
        </button>
        <button
          className="btn topbarSettingsBtn"
          onClick={() => setShowSettings((prev) => !prev)}
          style={{ opacity: showSettings ? 1 : 0.6 }}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <SixWeekGrid calendars={calendars} />

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
    </div>
  );
}
