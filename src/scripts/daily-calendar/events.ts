import type { Moment } from "moment";
import type { App } from "obsidian";
import { getPlugins, type IcsEvent, type IcsPlugin } from "../../types/ics";

const ICS_PLUGIN_ID = "ics";
const PLUGIN_WAIT_ATTEMPTS = 12;
const PLUGIN_WAIT_INTERVAL_MS = 500;

export interface TimedEvent {
  event: IcsEvent;
  startMinute: number;
  endMinute: number;
}

export interface DayEvents {
  timed: TimedEvent[];
  allDay: IcsEvent[];
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Startup templates can run before the ICS plugin has finished loading, so poll
 * briefly instead of failing outright.
 */
export async function resolveIcsPlugin(
  app: App,
  attempts = PLUGIN_WAIT_ATTEMPTS
): Promise<IcsPlugin | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const plugin = getPlugins(app).getPlugin(ICS_PLUGIN_ID);
    if (plugin) return plugin;
    await delay(PLUGIN_WAIT_INTERVAL_MS);
  }
  return null;
}

export async function fetchEvents(plugin: IcsPlugin, date: Moment): Promise<IcsEvent[]> {
  const events = await plugin.getEvents(date);
  return [...events].sort((a, b) => Number(a.utime) - Number(b.utime));
}

/** Splits events into all-day entries and grid-positioned timed entries. */
export function groupByPlacement(date: Moment, events: IcsEvent[]): DayEvents {
  const moment = window.moment;
  const dayStart = date.clone().startOf("day");
  const timed: TimedEvent[] = [];
  const allDay: IcsEvent[] = [];

  for (const event of events) {
    if (event.allDay) {
      allDay.push(event);
      continue;
    }

    const start = moment.unix(Number(event.utime));
    const end = moment.unix(Number(event.endUtime ?? event.utime));

    // Multi-day events are reported on each day they span.
    if (!start.isSame(date, "day") && !end.isSame(date, "day")) continue;

    const startMinute = start.diff(dayStart, "minutes");
    timed.push({
      event,
      startMinute,
      endMinute: Math.max(end.diff(dayStart, "minutes"), startMinute),
    });
  }

  return { timed, allDay };
}
