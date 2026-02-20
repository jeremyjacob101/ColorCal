import Foundation
import EventKit
import AppKit

// ---------- Helpers ----------

func jsonPrint(_ obj: Any) {
  let data = try! JSONSerialization.data(withJSONObject: obj, options: [])
  FileHandle.standardOutput.write(data)
}

func fail(_ message: String) -> Never {
  jsonPrint(["error": message])
  exit(1)
}

func hexFromCGColor(_ cg: CGColor?) -> String? {
  guard let cg else { return nil }
  guard let ns = NSColor(cgColor: cg)?.usingColorSpace(.sRGB) else { return nil }
  let r = Int(round(ns.redComponent * 255))
  let g = Int(round(ns.greenComponent * 255))
  let b = Int(round(ns.blueComponent * 255))
  return String(format: "#%02X%02X%02X", r, g, b)
}

func requestAccess(store: EKEventStore) -> Bool {
  let sem = DispatchSemaphore(value: 0)
  var granted = false

  if #available(macOS 14.0, *) {
    store.requestFullAccessToEvents { ok, _ in
      granted = ok
      sem.signal()
    }
  } else {
    store.requestAccess(to: .event) { ok, _ in
      granted = ok
      sem.signal()
    }
  }

  sem.wait()
  return granted
}

func argValue(_ name: String) -> String? {
  guard let idx = CommandLine.arguments.firstIndex(of: name) else { return nil }
  let next = idx + 1
  guard next < CommandLine.arguments.count else { return nil }
  return CommandLine.arguments[next]
}

// ---------- Commands ----------

let store = EKEventStore()
guard requestAccess(store: store) else {
  fail("Calendar access not granted. Enable it in System Settings > Privacy & Security > Calendars.")
}

guard CommandLine.arguments.count >= 2 else {
  fail("Missing command. Use: list-calendars | events-by-day | events-for-day")
}

let cmd = CommandLine.arguments[1]

if cmd == "list-calendars" {
  let calendars = store.calendars(for: .event)
  let out: [[String: Any]] = calendars.map { cal in
    [
      "id": cal.calendarIdentifier,
      "name": cal.title,
      "color": hexFromCGColor(cal.cgColor) ?? "#3B82F6"
    ]
  }
  jsonPrint(out)
  exit(0)
}

if cmd == "events-by-day" {
  guard
    let startMsStr = argValue("--start-ms"),
    let endMsStr = argValue("--end-ms"),
    let startMs = Int64(startMsStr),
    let endMs = Int64(endMsStr)
  else {
    fail("Missing --start-ms or --end-ms")
  }

  let calIds = (argValue("--cal-ids") ?? "")
    .split(separator: ",")
    .map { String($0) }
    .filter { !$0.isEmpty }

  let startDate = Date(timeIntervalSince1970: Double(startMs) / 1000.0)
  let endDate = Date(timeIntervalSince1970: Double(endMs) / 1000.0)

  let allCalendars = store.calendars(for: .event)
  let calendars: [EKCalendar]
  if calIds.isEmpty {
    calendars = allCalendars
  } else {
    let set = Set(calIds)
    calendars = allCalendars.filter { set.contains($0.calendarIdentifier) }
  }

  let predicate = store.predicateForEvents(withStart: startDate, end: endDate, calendars: calendars)
  let events = store.events(matching: predicate)

  let cal = Calendar.current
  let fmt = DateFormatter()
  fmt.calendar = cal
  fmt.locale = Locale(identifier: "en_US_POSIX")
  fmt.timeZone = TimeZone.current
  fmt.dateFormat = "yyyy-MM-dd"

  var byDay: [String: Set<String>] = [:]

  for e in events {
    let calId = e.calendar.calendarIdentifier

    // clamp + make end inclusive-ish so events ending at midnight count the previous day
    let s = max(e.startDate, startDate)
    let endExclusive = min(e.endDate, endDate)
    let endInclusive = endExclusive.addingTimeInterval(-0.001)
    if endInclusive < s { continue }

    var day = cal.startOfDay(for: s)
    let last = cal.startOfDay(for: endInclusive)

    while day <= last {
      let key = fmt.string(from: day)
      if byDay[key] == nil { byDay[key] = [] }
      byDay[key]!.insert(calId)
      day = cal.date(byAdding: .day, value: 1, to: day)!
    }
  }

  // convert Set -> Array for JSON
  var out: [String: [String]] = [:]
  for (k, v) in byDay {
    out[k] = Array(v)
  }

  jsonPrint(out)
  exit(0)
}

if cmd == "events-for-day" {
  guard
    let dayMsStr = argValue("--day-ms"),
    let dayMs = Int64(dayMsStr)
  else {
    fail("Missing --day-ms")
  }

  let calIds = (argValue("--cal-ids") ?? "")
    .split(separator: ",")
    .map { String($0) }
    .filter { !$0.isEmpty }

  let dayDate = Date(timeIntervalSince1970: Double(dayMs) / 1000.0)
  let cal = Calendar.current
  let dayStart = cal.startOfDay(for: dayDate)
  let dayEnd = cal.date(byAdding: .day, value: 1, to: dayStart)!

  let allCalendars = store.calendars(for: .event)
  let calendars: [EKCalendar]
  if calIds.isEmpty {
    calendars = allCalendars
  } else {
    let set = Set(calIds)
    calendars = allCalendars.filter { set.contains($0.calendarIdentifier) }
  }

  let predicate = store.predicateForEvents(withStart: dayStart, end: dayEnd, calendars: calendars)
  let events = store.events(matching: predicate)

  let out: [[String: Any]] = events.compactMap { e in
    let overlapStart = max(e.startDate, dayStart)
    let overlapEnd = min(e.endDate, dayEnd)
    if overlapEnd <= overlapStart { return nil }

    return [
      "id": e.eventIdentifier ?? UUID().uuidString,
      "title": (e.title?.isEmpty == false ? e.title! : "Untitled Event"),
      "startMs": Int64((e.startDate.timeIntervalSince1970 * 1000.0).rounded()),
      "endMs": Int64((e.endDate.timeIntervalSince1970 * 1000.0).rounded()),
      "isAllDay": e.isAllDay,
      "calendarId": e.calendar.calendarIdentifier,
      "calendarName": e.calendar.title
    ]
  }

  jsonPrint(out)
  exit(0)
}

fail("Unknown command: \(cmd)")
