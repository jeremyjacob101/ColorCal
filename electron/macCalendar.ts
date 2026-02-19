import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runJxa(script: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "osascript",
    ["-l", "JavaScript", "-e", script],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return stdout.trim();
}

export type MacCalendar = { idx: number; name: string };
export type MacEvent = { calIdx: number; startMs: number; endMs: number };

export async function listCalendarsMac(): Promise<MacCalendar[]> {
  const script = `
    (function () {
      const C = Application("Calendar");
      const cals = C.calendars();
      const out = [];
      for (let i = 0; i < cals.length; i++) {
        out.push({ idx: i, name: cals[i].name() });
      }
      return JSON.stringify(out);
    })();
  `;
  const raw = await runJxa(script);
  return JSON.parse(raw) as MacCalendar[];
}

export async function fetchEventsMac(args: {
  calendarIdxs: number[];
  startMs: number;
  endMs: number;
}): Promise<MacEvent[]> {
  const { calendarIdxs, startMs, endMs } = args;

  // Filter in JS for reliability (Calendar scripting is finicky with whose() in some setups).
  const script = `
    (function () {
      const C = Application("Calendar");
      const cals = C.calendars();
      const idxs = ${JSON.stringify(calendarIdxs)};
      const start = ${startMs};
      const end = ${endMs};
      const out = [];

      for (const idx of idxs) {
        const cal = cals[idx];
        if (!cal) continue;

        const evs = cal.events();
        for (const e of evs) {
          const s = e.startDate().getTime();
          const en = e.endDate().getTime();
          // overlap test
          if (s < end && en > start) {
            out.push({ calIdx: idx, startMs: s, endMs: en });
          }
        }
      }

      return JSON.stringify(out);
    })();
  `;

  const raw = await runJxa(script);
  return JSON.parse(raw) as MacEvent[];
}
