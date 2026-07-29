import type { Moment } from "moment";
import type { App, Plugin } from "obsidian";

/**
 * Event shape returned by the ICS Calendar plugin's `getEvents()`.
 * Mirrors https://github.com/open-horizon-labs/obsidian-ics `IEvent`.
 */
export interface IcsEvent {
  utime: string | number;
  endUtime?: string | number;
  time: string;
  endTime?: string;
  summary: string;
  location?: string;
  description?: string;
  icsName?: string;
  allDay?: boolean;
  startDateTime?: string;
  endDateTime?: string;
}

export interface IcsPlugin extends Plugin {
  getEvents(...dates: Array<Moment | Date | string>): Promise<IcsEvent[]>;
}

interface AppWithPlugins extends App {
  plugins: {
    getPlugin(id: string): IcsPlugin | null;
  };
}

/** `app.plugins` is not part of Obsidian's public API surface. */
export function getPlugins(app: App): AppWithPlugins["plugins"] {
  return (app as AppWithPlugins).plugins;
}
