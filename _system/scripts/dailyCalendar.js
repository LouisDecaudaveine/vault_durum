// Generated from src/scripts/daily-calendar/main.ts by src/build.mjs — do not edit directly.
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/scripts/daily-calendar/main.ts
var main_exports = {};
__export(main_exports, {
  renderDailyNote: () => renderDailyNote,
  syncWeek: () => syncWeek
});
module.exports = __toCommonJS(main_exports);

// src/scripts/daily-calendar/config.ts
var DAILY_FOLDER = "Daily";
var DAILY_DATE_FORMAT = "YYYY-MM-DD";
var TITLE_FORMAT = "dddd, MMMM D, YYYY";
var SYNC_DAYS = 7;
var CALENDAR_BLOCK_START = "<!-- calendar-auto -->";
var CALENDAR_BLOCK_END = "<!-- /calendar-auto -->";

// src/types/ics.ts
function getPlugins(app) {
  return app.plugins;
}

// src/scripts/daily-calendar/events.ts
var ICS_PLUGIN_ID = "ics";
var PLUGIN_WAIT_ATTEMPTS = 12;
var PLUGIN_WAIT_INTERVAL_MS = 500;
var delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
async function resolveIcsPlugin(app, attempts = PLUGIN_WAIT_ATTEMPTS) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const plugin = getPlugins(app).getPlugin(ICS_PLUGIN_ID);
    if (plugin) return plugin;
    await delay(PLUGIN_WAIT_INTERVAL_MS);
  }
  return null;
}
async function fetchEvents(plugin, date) {
  const events = await plugin.getEvents(date);
  return [...events].sort((a, b) => Number(a.utime) - Number(b.utime));
}
function groupByPlacement(date, events) {
  const moment = window.moment;
  const dayStart = date.clone().startOf("day");
  const timed = [];
  const allDay = [];
  for (const event of events) {
    if (event.allDay) {
      allDay.push(event);
      continue;
    }
    const start = moment.unix(Number(event.utime));
    const end = moment.unix(Number(event.endUtime ?? event.utime));
    if (!start.isSame(date, "day") && !end.isSame(date, "day")) continue;
    const startMinute = start.diff(dayStart, "minutes");
    timed.push({
      event,
      startMinute,
      endMinute: Math.max(end.diff(dayStart, "minutes"), startMinute)
    });
  }
  return { timed, allDay };
}

// src/scripts/daily-calendar/note.ts
var CALENDAR_BLOCK_PATTERN = new RegExp(
  `${CALENDAR_BLOCK_START}[\\s\\S]*?${CALENDAR_BLOCK_END}`
);
var DEFAULT_BODY = `## Notes

## Todos

- [ ] `;
function buildDailyNote(date, calendarBlock, body = DEFAULT_BODY) {
  return `# ${date.format(TITLE_FORMAT)}

${CALENDAR_BLOCK_START}
${calendarBlock}
${CALENDAR_BLOCK_END}

${body.trim()}
`;
}
function hasCalendarBlock(content) {
  return CALENDAR_BLOCK_PATTERN.test(content);
}
function replaceCalendarBlock(content, calendarBlock) {
  return content.replace(
    CALENDAR_BLOCK_PATTERN,
    `${CALENDAR_BLOCK_START}
${calendarBlock}
${CALENDAR_BLOCK_END}`
  );
}
function unmanagedBody(content) {
  const body = content.split("\n").filter((line) => !line.startsWith("# ")).join("\n").replace(CALENDAR_BLOCK_PATTERN, "").trim();
  return body.length > 0 ? body : DEFAULT_BODY;
}

// src/scripts/daily-calendar/render.ts
var FALLBACK = `> [!summary]+ Nothing scheduled
> Your day is wide open.`;
function calloutType(calendarName) {
  return `calendar-${calendarName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
function formatTime(event) {
  if (!event.time) return "";
  const end = event.endTime && event.endTime !== event.time ? ` \u2013 ${event.endTime}` : "";
  return `**${event.time}${end}**`;
}
function renderEvent(event) {
  const time = formatTime(event);
  const location = event.location ? ` \xB7 _${event.location}_` : "";
  return time ? `> - ${time} ${event.summary}${location}` : `> - ${event.summary}${location}`;
}
function renderCalendarGroup(calendarName, events) {
  const type = calloutType(calendarName);
  const header = `> [!${type}]+ ${calendarName}`;
  const items = events.map(renderEvent).join("\n");
  return `${header}
${items}`;
}
function renderDayCalendar(date, events) {
  const grouped = groupByPlacement(date, events);
  const allEvents = [...grouped.allDay, ...grouped.timed.map((t) => t.event)];
  if (allEvents.length === 0) return FALLBACK;
  const byCalendar = /* @__PURE__ */ new Map();
  for (const event of allEvents) {
    const name = event.icsName ?? "Other";
    const list = byCalendar.get(name) ?? [];
    list.push(event);
    byCalendar.set(name, list);
  }
  const sections = [];
  for (const [calendarName, calEvents] of byCalendar) {
    sections.push(renderCalendarGroup(calendarName, calEvents));
  }
  return sections.join("\n\n");
}

// src/scripts/daily-calendar/main.ts
var TEMPLATE_WAIT_ATTEMPTS = 4;
var LOG_PREFIX = "[dailyCalendar]";
async function ensureFolder(app, path) {
  if (app.vault.getFolderByPath(path)) return;
  await app.vault.createFolder(path);
}
async function writeDay(app, date, calendarBlock) {
  const path = `${DAILY_FOLDER}/${date.format(DAILY_DATE_FORMAT)}.md`;
  const file = app.vault.getFileByPath(path);
  if (!file) {
    await app.vault.create(path, buildDailyNote(date, calendarBlock));
    return;
  }
  await app.vault.process(
    file,
    (data) => hasCalendarBlock(data) ? replaceCalendarBlock(data, calendarBlock) : buildDailyNote(date, calendarBlock, unmanagedBody(data))
  );
}
async function renderDailyNote(tp, fileTitle) {
  const date = window.moment(fileTitle, DAILY_DATE_FORMAT, true);
  if (!date.isValid()) {
    console.warn(`${LOG_PREFIX} "${fileTitle}" is not a ${DAILY_DATE_FORMAT} date.`);
    return `# ${fileTitle}
`;
  }
  const plugin = await resolveIcsPlugin(tp.app, TEMPLATE_WAIT_ATTEMPTS);
  if (!plugin) {
    console.warn(`${LOG_PREFIX} ICS plugin unavailable; wrote note without a calendar.`);
    return `# ${date.format(TITLE_FORMAT)}

_Calendar unavailable: the ICS plugin is not loaded._
`;
  }
  const events = await fetchEvents(plugin, date);
  return buildDailyNote(date, renderDayCalendar(date, events));
}
async function syncWeek(tp, days = SYNC_DAYS) {
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
