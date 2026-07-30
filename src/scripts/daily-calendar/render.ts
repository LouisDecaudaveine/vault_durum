import type { Moment } from "moment";
import type { IcsEvent } from "../../types/ics";
import { groupByPlacement } from "./events";

const FALLBACK = `> [!summary]+ Nothing scheduled
> Your day is wide open.`;

function calloutType(calendarName: string): string {
  return `calendar-${calendarName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function formatTime(event: IcsEvent): string {
  if (!event.time) return "";
  const end = event.endTime && event.endTime !== event.time ? ` – ${event.endTime}` : "";
  return `**${event.time}${end}**`;
}

function renderEvent(event: IcsEvent): string {
  const time = formatTime(event);
  const location = event.location ? ` · _${event.location}_` : "";
  return time
    ? `> - ${time} ${event.summary}${location}`
    : `> - ${event.summary}${location}`;
}

function renderCalendarGroup(calendarName: string, events: IcsEvent[]): string {
  const type = calloutType(calendarName);
  const header = `> [!${type}]+ ${calendarName}`;
  const items = events.map(renderEvent).join("\n");
  return `${header}\n${items}`;
}

/** Renders the day's events as native Obsidian callouts grouped by calendar. */
export function renderDayCalendar(date: Moment, events: IcsEvent[]): string {
  const grouped = groupByPlacement(date, events);
  const allEvents = [...grouped.allDay, ...grouped.timed.map((t) => t.event)];

  if (allEvents.length === 0) return FALLBACK;

  const byCalendar = new Map<string, IcsEvent[]>();

  for (const event of allEvents) {
    const name = event.icsName ?? "Other";
    const list = byCalendar.get(name) ?? [];
    list.push(event);
    byCalendar.set(name, list);
  }

  const sections: string[] = [];

  for (const [calendarName, calEvents] of byCalendar) {
    sections.push(renderCalendarGroup(calendarName, calEvents));
  }

  return sections.join("\n\n");
}
