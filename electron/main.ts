import { app, BrowserWindow, ipcMain, nativeImage, Tray } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { listCalendarsEventKit, eventsByDayEventKit } from "./eventkitBridge";
import { store, type CalendarPref } from "./settings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let win: BrowserWindow | null = null;

async function ensureCalendarPrefs(): Promise<CalendarPref[]> {
  const macCals = await listCalendarsEventKit();
  const existing = store.get("calendars") ?? [];

  const merged: CalendarPref[] = macCals.map((c) => {
    const found = existing.find((e) => e.id === c.id);
    return {
      id: c.id,
      name: c.name,
      enabled: found?.enabled ?? true,
      color: c.color, // from EventKit
    };
  });

  store.set("calendars", merged);
  return merged;
}

function getIndexToLoad(): { type: "url" | "file"; value: string } {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) return { type: "url", value: devUrl };

  // Try a few common electron-vite production locations
  const candidates = [
    path.join(__dirname, "../renderer/index.html"),
    path.join(__dirname, "../index.html"),
    path.join(__dirname, "../../dist/index.html"),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (file) return { type: "file", value: file };

  // Fallback so we at least don't crash
  return { type: "url", value: "data:text/html,<h3>Renderer not found</h3>" };
}

function createWindow() {
  if (win) return win;

  win = new BrowserWindow({
    width: 250,
    height: 250,
    useContentSize: true,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const target = getIndexToLoad();
  if (target.type === "url") win.loadURL(target.value);
  else win.loadFile(target.value);

  // Hide when you click away (popover-ish behavior)
  win.on("blur", () => {
    if (win && !win.webContents.isDevToolsOpened()) {
      win.hide();
    }
  });

  return win;
}

function showWindow() {
  const w = createWindow();
  if (!tray) return;

  const trayBounds = tray.getBounds();
  const winBounds = w.getBounds();

  // Center under tray icon
  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - winBounds.width / 2,
  );
  const y = Math.round(trayBounds.y + trayBounds.height + 6);

  w.setPosition(x, y, false);
  w.show();
  w.focus();
}

function toggleWindow() {
  const w = createWindow();
  if (w.isVisible()) w.hide();
  else showWindow();
}

app.whenReady().then(() => {
  // Menubar-only feel on mac
  app.dock?.hide();

  const trayPath = path.join(process.cwd(), "build", "trayTemplate.png");
  const trayImage = nativeImage.createFromPath(trayPath);
  trayImage.setTemplateImage?.(true);

  tray = new Tray(trayImage);
  tray.setToolTip("ColorCal");
  tray.on("click", toggleWindow);

  // Optional: right-click to toggle too
  tray.on("right-click", toggleWindow);

  // Pre-create hidden window so first open is instant
  createWindow();
});

app.on("window-all-closed", () => {
  // Menubar apps generally keep running; do nothing
});

/* ---------------- IPC ---------------- */

ipcMain.handle("calendars:list", async () => {
  return await ensureCalendarPrefs();
});

ipcMain.handle("calendars:save", async (_evt, prefs: CalendarPref[]) => {
  store.set("calendars", prefs);
  return true;
});

ipcMain.handle(
  "events:byDay",
  async (_evt, args: { startMs: number; endMs: number }) => {
    const prefs = await ensureCalendarPrefs();
    const enabledIds = prefs.filter((p) => p.enabled).map((p) => p.id);
    return await eventsByDayEventKit({
      startMs: args.startMs,
      endMs: args.endMs,
      calIds: enabledIds,
    });
  },
);
