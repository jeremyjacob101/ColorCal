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
const bridgeMainPath = path.join(
  bridgeDir,
  "Sources",
  "ColorCalBridge",
  "main.swift",
);
const packageManifestPath = path.join(bridgeDir, "Package.swift");

async function ensureBuilt() {
  if (fs.existsSync(binPath)) {
    const binStat = fs.statSync(binPath);
    const mainStat = fs.statSync(bridgeMainPath);
    const pkgStat = fs.statSync(packageManifestPath);
    const binMs = binStat.mtimeMs;
    if (mainStat.mtimeMs <= binMs && pkgStat.mtimeMs <= binMs) return;
  }
  await execFileAsync("swift", ["build", "-c", "release"], { cwd: bridgeDir });
}

export type BridgeCalendar = { id: string; name: string; color: string };
export type BridgeDayEvent = {
  id: string;
  title: string;
  startMs: number;
  endMs: number;
  isAllDay: boolean;
  calendarId: string;
  calendarName: string;
};

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

export async function eventsForDayEventKit(args: {
  dayMs: number;
  calIds: string[];
}): Promise<BridgeDayEvent[]> {
  await ensureBuilt();
  const { stdout } = await execFileAsync(
    binPath,
    [
      "events-for-day",
      "--day-ms",
      String(args.dayMs),
      "--cal-ids",
      args.calIds.join(","),
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  return JSON.parse(stdout.trim());
}
