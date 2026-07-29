import type { Moment } from "moment";
import type { IcsEvent } from "../../types/ics";
import {
  CALENDAR_COLORS,
  DEFAULT_CALENDAR_COLOR,
  HOUR_HEIGHT_PX,
  type CalendarColor,
} from "./config";
import { groupByPlacement, type DayEvents } from "./events";
import { gridHeightPx, hourOffsetPercent, placeEvent, visibleHours } from "./layout";

function escapeHtml(value: string | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colorFor(event: IcsEvent): CalendarColor {
  return CALENDAR_COLORS[event.icsName ?? ""] ?? DEFAULT_CALENDAR_COLOR;
}

function timeLabel(event: IcsEvent): string {
  const end = event.endTime && event.endTime !== event.time ? ` – ${event.endTime}` : "";
  return escapeHtml(`${event.time}${end}`);
}

function renderAllDayRow(events: IcsEvent[]): string {
  if (events.length === 0) return "";

  const items = events.map((event) => {
    const color = colorFor(event);
    const calendar = event.icsName
      ? `<span class="day-calendar-event-cal">${escapeHtml(event.icsName)}</span>`
      : "";

    return (
      `<div class="day-calendar-event day-calendar-event--all-day"` +
      ` style="background:${color.bg};border-left-color:${color.border};">` +
      `<span class="day-calendar-event-title">${escapeHtml(event.summary)}</span>` +
      `${calendar}</div>`
    );
  });

  return `<div class="day-calendar-allday">${items.join("")}</div>`;
}

function renderHourLabels(): string {
  const labels = visibleHours().map((hour) => {
    const label = `${String(hour).padStart(2, "0")}:00`;
    return `<span class="day-calendar-label" style="top:${hourOffsetPercent(hour)}%;">${label}</span>`;
  });
  return `<div class="day-calendar-labels">${labels.join("")}</div>`;
}

function renderGrid({ timed }: DayEvents): string {
  const lines = visibleHours().map(
    (hour) =>
      `<div class="day-calendar-grid-line" style="top:${hourOffsetPercent(hour)}%;"></div>`
  );

  const events = timed.map(({ event, startMinute, endMinute }) => {
    const { topPercent, heightPercent } = placeEvent(startMinute, endMinute);
    const color = colorFor(event);
    const location = event.location
      ? `<span class="day-calendar-event-location">${escapeHtml(event.location)}</span>`
      : "";

    return (
      `<div class="day-calendar-event"` +
      ` style="top:${topPercent}%;height:${heightPercent}%;` +
      `background:${color.bg};border-left-color:${color.border};"` +
      ` title="${escapeHtml(event.summary)}">` +
      `<span class="day-calendar-event-time">${timeLabel(event)}</span>` +
      `<span class="day-calendar-event-title">${escapeHtml(event.summary)}</span>` +
      `${location}</div>`
    );
  });

  return `<div class="day-calendar-grid">${lines.join("")}${events.join("")}</div>`;
}

/** Renders the day's events as a single self-contained HTML block. */
export function renderDayCalendar(date: Moment, events: IcsEvent[]): string {
  const grouped = groupByPlacement(date, events);

  return (
    `<div class="day-calendar">` +
    renderAllDayRow(grouped.allDay) +
    `<div class="day-calendar-inner" style="height:${gridHeightPx(HOUR_HEIGHT_PX)}px;">` +
    renderHourLabels() +
    renderGrid(grouped) +
    `</div></div>`
  );
}
