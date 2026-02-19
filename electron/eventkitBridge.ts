import path from "node:path";
import fs from "node:fs";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const execFileAsync = promisify(execFile);

const bridgeDir = path.join(
  process.cwd(),
  "native",
  "colorcal-eventkit-bridge",
);
const binPath = path.join(bridgeDir, ".build", "release", "ColorCalBridge");

async function ensureBuilt() {
  if (fs.existsSync(binPath)) return;
  await execFileAsync("swift", ["build", "-c", "release"], { cwd: bridgeDir });
}

export type BridgeCalendar = { id: string; name: string; color: string };

export async function listCalendarsEventKit(): Promise<BridgeCalendar[]> {
  await ensureBuilt();
  const { stdout } = await execFileAsync(binPath, ["list-calendars"], {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout.trim());
}

export async function eventsByDayEventKit(args: {
  startMs: number;
  endMs: number;
  calIds: string[];
}): Promise<Record<string, string[]>> {
  await ensureBuilt();
  const { stdout } = await execFileAsync(
    binPath,
    [
      "events-by-day",
      "--start-ms",
      String(args.startMs),
      "--end-ms",
      String(args.endMs),
      "--cal-ids",
      args.calIds.join(","),
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  return JSON.parse(stdout.trim());
}
