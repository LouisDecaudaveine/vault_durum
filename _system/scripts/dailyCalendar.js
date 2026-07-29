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
var DAY_START_HOUR = 7;
var DAY_END_HOUR = 23;
var HOUR_HEIGHT_PX = 48;
var CALENDAR_BLOCK_START = "<!-- calendar-auto -->";
var CALENDAR_BLOCK_END = "<!-- /calendar-auto -->";
var CALENDAR_COLORS = {
  Social: { bg: "rgba(235, 120, 154, 0.28)", border: "#eb789a" },
  work: { bg: "rgba(99, 145, 235, 0.28)", border: "#6391eb" },
  todo: { bg: "rgba(99, 200, 130, 0.28)", border: "#63c882" },
  holidays: { bg: "rgba(180, 120, 235, 0.28)", border: "#b478eb" }
};
var DEFAULT_CALENDAR_COLOR = {
  bg: "rgba(140, 140, 160, 0.28)",
  border: "#8c8ca0"
};

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
var DEFAULT_LEFT_BODY = `## Notes

## Todos

- [ ] `;
function buildDailyNote(date, calendarHtml, leftBody = DEFAULT_LEFT_BODY) {
  return `# ${date.format(TITLE_FORMAT)}

<div class="daily-note-layout">

<div class="daily-left">

${leftBody.trim()}

</div>

<div class="daily-right">

${CALENDAR_BLOCK_START}
${calendarHtml}
${CALENDAR_BLOCK_END}

</div>

</div>
`;
}
function hasCalendarBlock(content) {
  return CALENDAR_BLOCK_PATTERN.test(content);
}
function replaceCalendarBlock(content, calendarHtml) {
  return content.replace(
    CALENDAR_BLOCK_PATTERN,
    `${CALENDAR_BLOCK_START}
${calendarHtml}
${CALENDAR_BLOCK_END}`
  );
}
function unmanagedBody(content) {
  const body = content.split("\n").filter((line) => !line.startsWith("# ")).join("\n").trim();
  return body.length > 0 ? body : DEFAULT_LEFT_BODY;
}

// src/scripts/daily-calendar/layout.ts
var MINUTES_PER_HOUR = 60;
var MIN_EVENT_MINUTES = 15;
var MIN_EVENT_HEIGHT_PERCENT = 4;
var dayStartMinute = DAY_START_HOUR * MINUTES_PER_HOUR;
var dayEndMinute = DAY_END_HOUR * MINUTES_PER_HOUR;
var daySpanMinutes = dayEndMinute - dayStartMinute;
function offsetPercent(minuteOfDay) {
  return (minuteOfDay - dayStartMinute) / daySpanMinutes * 100;
}
function hourOffsetPercent(hour) {
  return offsetPercent(hour * MINUTES_PER_HOUR);
}
function placeEvent(startMinute, endMinute) {
  const start = Math.max(dayStartMinute, Math.min(startMinute, dayEndMinute));
  const end = Math.max(start + MIN_EVENT_MINUTES, Math.min(endMinute, dayEndMinute));
  return {
    topPercent: offsetPercent(start),
    heightPercent: Math.max(
      (end - start) / daySpanMinutes * 100,
      MIN_EVENT_HEIGHT_PERCENT
    )
  };
}
function gridHeightPx(hourHeightPx) {
  return (DAY_END_HOUR - DAY_START_HOUR) * hourHeightPx;
}
function visibleHours() {
  const hours = [];
  for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour++) {
    hours.push(hour);
  }
  return hours;
}

// src/scripts/daily-calendar/render.ts
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function colorFor(event) {
  return CALENDAR_COLORS[event.icsName ?? ""] ?? DEFAULT_CALENDAR_COLOR;
}
function timeLabel(event) {
  const end = event.endTime && event.endTime !== event.time ? ` \u2013 ${event.endTime}` : "";
  return escapeHtml(`${event.time}${end}`);
}
function renderAllDayRow(events) {
  if (events.length === 0) return "";
  const items = events.map((event) => {
    const color = colorFor(event);
    const calendar = event.icsName ? `<span class="day-calendar-event-cal">${escapeHtml(event.icsName)}</span>` : "";
    return `<div class="day-calendar-event day-calendar-event--all-day" style="background:${color.bg};border-left-color:${color.border};"><span class="day-calendar-event-title">${escapeHtml(event.summary)}</span>${calendar}</div>`;
  });
  return `<div class="day-calendar-allday">${items.join("")}</div>`;
}
function renderHourLabels() {
  const labels = visibleHours().map((hour) => {
    const label = `${String(hour).padStart(2, "0")}:00`;
    return `<span class="day-calendar-label" style="top:${hourOffsetPercent(hour)}%;">${label}</span>`;
  });
  return `<div class="day-calendar-labels">${labels.join("")}</div>`;
}
function renderGrid({ timed }) {
  const lines = visibleHours().map(
    (hour) => `<div class="day-calendar-grid-line" style="top:${hourOffsetPercent(hour)}%;"></div>`
  );
  const events = timed.map(({ event, startMinute, endMinute }) => {
    const { topPercent, heightPercent } = placeEvent(startMinute, endMinute);
    const color = colorFor(event);
    const location = event.location ? `<span class="day-calendar-event-location">${escapeHtml(event.location)}</span>` : "";
    return `<div class="day-calendar-event" style="top:${topPercent}%;height:${heightPercent}%;background:${color.bg};border-left-color:${color.border};" title="${escapeHtml(event.summary)}"><span class="day-calendar-event-time">${timeLabel(event)}</span><span class="day-calendar-event-title">${escapeHtml(event.summary)}</span>${location}</div>`;
  });
  return `<div class="day-calendar-grid">${lines.join("")}${events.join("")}</div>`;
}
function renderDayCalendar(date, events) {
  const grouped = groupByPlacement(date, events);
  return `<div class="day-calendar">` + renderAllDayRow(grouped.allDay) + `<div class="day-calendar-inner" style="height:${gridHeightPx(HOUR_HEIGHT_PX)}px;">` + renderHourLabels() + renderGrid(grouped) + `</div></div>`;
}

// src/scripts/daily-calendar/main.ts
var TEMPLATE_WAIT_ATTEMPTS = 4;
var LOG_PREFIX = "[dailyCalendar]";
async function ensureFolder(app, path) {
  if (app.vault.getFolderByPath(path)) return;
  await app.vault.createFolder(path);
}
async function writeDay(app, date, calendarHtml) {
  const path = `${DAILY_FOLDER}/${date.format(DAILY_DATE_FORMAT)}.md`;
  const file = app.vault.getFileByPath(path);
  if (!file) {
    await app.vault.create(path, buildDailyNote(date, calendarHtml));
    return;
  }
  await app.vault.process(
    file,
    (data) => hasCalendarBlock(data) ? replaceCalendarBlock(data, calendarHtml) : buildDailyNote(date, calendarHtml, unmanagedBody(data))
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
