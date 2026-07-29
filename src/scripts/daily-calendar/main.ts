import type { Moment } from "moment";
import type { App } from "obsidian";
import type { Templater } from "../../types/templater";
import { DAILY_DATE_FORMAT, DAILY_FOLDER, SYNC_DAYS, TITLE_FORMAT } from "./config";
import { fetchEvents, resolveIcsPlugin } from "./events";
import {
  buildDailyNote,
  hasCalendarBlock,
  replaceCalendarBlock,
  unmanagedBody,
} from "./note";
import { renderDayCalendar } from "./render";

/** A note being created interactively should not stall on a slow plugin load. */
const TEMPLATE_WAIT_ATTEMPTS = 4;

const LOG_PREFIX = "[dailyCalendar]";

async function ensureFolder(app: App, path: string): Promise<void> {
  if (app.vault.getFolderByPath(path)) return;
  await app.vault.createFolder(path);
}

async function writeDay(app: App, date: Moment, calendarHtml: string): Promise<void> {
  const path = `${DAILY_FOLDER}/${date.format(DAILY_DATE_FORMAT)}.md`;
  const file = app.vault.getFileByPath(path);

  if (!file) {
    await app.vault.create(path, buildDailyNote(date, calendarHtml));
    return;
  }

  await app.vault.process(file, (data) =>
    hasCalendarBlock(data)
      ? replaceCalendarBlock(data, calendarHtml)
      : buildDailyNote(date, calendarHtml, unmanagedBody(data))
  );
}

/**
 * Body for a new daily note, built from the ICS events on the note's date.
 * Called by the `Daily Note` template, which passes `tp.file.title`.
 */
export async function renderDailyNote(tp: Templater, fileTitle: string): Promise<string> {
  const date = window.moment(fileTitle, DAILY_DATE_FORMAT, true);

  if (!date.isValid()) {
    console.warn(`${LOG_PREFIX} "${fileTitle}" is not a ${DAILY_DATE_FORMAT} date.`);
    return `# ${fileTitle}\n`;
  }

  const plugin = await resolveIcsPlugin(tp.app, TEMPLATE_WAIT_ATTEMPTS);

  if (!plugin) {
    console.warn(`${LOG_PREFIX} ICS plugin unavailable; wrote note without a calendar.`);
    return `# ${date.format(TITLE_FORMAT)}\n\n_Calendar unavailable: the ICS plugin is not loaded._\n`;
  }

  const events = await fetchEvents(plugin, date);
  return buildDailyNote(date, renderDayCalendar(date, events));
}

/**
 * Refreshes the calendar block for today and the following days, creating any
 * missing notes. Runs as a Templater startup template.
 */
export async function syncWeek(tp: Templater, days = SYNC_DAYS): Promise<void> {
  const { app } = tp;
  const plugin = await resolveIcsPlugin(app);

  if (!plugin) {
    console.warn(`${LOG_PREFIX} ICS plugin unavailable; skipped week sync.`);
    return;
  }

  await ensureFolder(app, DAILY_FOLDER);
  const today = window.moment().startOf("day");

  for (let offset = 0; offset < days; offset++) {
    const date = today.clone().add(offset, "days");
    try {
      const events = await fetchEvents(plugin, date);
      await writeDay(app, date, renderDayCalendar(date, events));
    } catch (error) {
      console.error(`${LOG_PREFIX} failed to sync ${date.format(DAILY_DATE_FORMAT)}`, error);
    }
  }
}
