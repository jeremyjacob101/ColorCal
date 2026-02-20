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
          onClick={() => setShowSettings(true)}
          style={{ opacity: showSettings ? 1 : 0.6 }}
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {showSettings ? (
        <SettingsPanel calendars={calendars} onChange={setCalendars} />
      ) : (
        <SixWeekGrid calendars={calendars} />
      )}
    </div>
  );
}
