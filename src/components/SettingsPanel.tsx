import type { CalendarPref } from "../types/colorcal";

type Props = {
  calendars: CalendarPref[];
  onChange: (next: CalendarPref[]) => void;
};

type CalendarPrefWithOptionalSource = CalendarPref &
  Partial<{
    provider: string;
    source: string;
    accountType: string;
    origin: string;
    accountName: string;
    account: string;
  }>;

function toHexIfPossible(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return "#3b82f6";
}

// Tries to group like macOS: iCloud / Google / Subscribed / Other.
// If your CalendarPref has different fields, this still falls back safely.
function getGroupLabel(c: CalendarPref): string {
  const calendar = c as CalendarPrefWithOptionalSource;

  const provider =
    (typeof calendar.provider === "string" && calendar.provider) ||
    (typeof calendar.source === "string" && calendar.source) ||
    (typeof calendar.accountType === "string" && calendar.accountType) ||
    (typeof calendar.origin === "string" && calendar.origin) ||
    "";

  const accountName =
    (typeof calendar.accountName === "string" && calendar.accountName) ||
    (typeof calendar.account === "string" && calendar.account) ||
    "";

  const p = provider.toLowerCase();
  const a = accountName.toLowerCase();

  if (p.includes("icloud") || a.includes("icloud") || a.includes("apple")) return "iCloud";
  if (p.includes("google") || a.includes("google") || a.includes("gmail")) return "Google";
  if (p.includes("sub") || a.includes("sub") || p.includes("webcal") || p.includes("ics"))
    return "Subscribed Calendars";

  // If you have a clean account name, use it as a header (looks nice / native).
  if (accountName.trim()) return accountName.trim();

  return "Calendars";
}

function groupCalendars(cals: CalendarPref[]) {
  const map = new Map<string, CalendarPref[]>();
  for (const c of cals) {
    const label = getGroupLabel(c);
    const arr = map.get(label) ?? [];
    arr.push(c);
    map.set(label, arr);
  }
  return Array.from(map.entries());
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

  const grouped = groupCalendars(calendars);

  return (
    <div className="panel panel--settings">
      {grouped.map(([label, items]) => (
        <section key={label} className="ccSection" aria-label={label}>
          <div className="ccSectionTitle">{label}</div>

          <div className="ccCard">
            {items.map((c) => (
              <div key={c.id} className="ccRow">
                {/* Left: color dot + name */}
                <div className="ccLeft">
                  <span
                    className="ccDot"
                    style={{ background: toHexIfPossible(c.color) }}
                    aria-hidden="true"
                  />

                  <span className="ccName" title={c.name}>
                    {c.name}
                  </span>
                </div>

                {/* Right: mac-like switch */}
                <label className="ccSwitch" title={c.enabled ? "On" : "Off"}>
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={() => toggle(c.id)}
                    aria-label={`Toggle ${c.name}`}
                  />
                  <span className="ccSwitchTrack" aria-hidden="true">
                    <span className="ccSwitchThumb" aria-hidden="true" />
                  </span>
                </label>

                {/* Hidden color picker (clickable dot area for quick change) */}
                <input
                  className="ccColorWell"
                  type="color"
                  value={toHexIfPossible(c.color)}
                  onChange={(e) => setColor(c.id, e.target.value)}
                  title="Dot color"
                  aria-label={`Set color for ${c.name}`}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
