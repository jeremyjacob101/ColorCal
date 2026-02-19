import type { CalendarPref } from "../types/colorcal";

type Props = {
  calendars: CalendarPref[];
  onChange: (next: CalendarPref[]) => void;
};

function toHexIfPossible(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return "#3b82f6";
}

export function SettingsPanel({ calendars, onChange }: Props) {
  const toggle = (id: string) => {
    const next = calendars.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c,
    );
    onChange(next);
    window.colorcal.saveCalendars(next).catch(() => {});
  };

  const setColor = (id: string, color: string) => {
    const next = calendars.map((c) => (c.id === id ? { ...c, color } : c));
    onChange(next);
    window.colorcal.saveCalendars(next).catch(() => {});
  };

  return (
    <div className="panel">
      {calendars.map((c) => (
        <div key={c.id} className="row">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={c.enabled}
              onChange={() => toggle(c.id)}
            />
            <span className="name" title={c.name}>
              {c.name}
            </span>
          </label>

          <input
            type="color"
            value={toHexIfPossible(c.color)}
            onChange={(e) => setColor(c.id, e.target.value)}
            title="Dot color"
          />
        </div>
      ))}
    </div>
  );
}
