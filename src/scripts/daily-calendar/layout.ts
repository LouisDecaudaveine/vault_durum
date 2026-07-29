import { DAY_END_HOUR, DAY_START_HOUR } from "./config";

const MINUTES_PER_HOUR = 60;
const MIN_EVENT_MINUTES = 15;
const MIN_EVENT_HEIGHT_PERCENT = 4;

export interface Placement {
  topPercent: number;
  heightPercent: number;
}

export const dayStartMinute = DAY_START_HOUR * MINUTES_PER_HOUR;
export const dayEndMinute = DAY_END_HOUR * MINUTES_PER_HOUR;
export const daySpanMinutes = dayEndMinute - dayStartMinute;

/** Vertical offset of a minute-of-day within the grid, as a percentage. */
export function offsetPercent(minuteOfDay: number): number {
  return ((minuteOfDay - dayStartMinute) / daySpanMinutes) * 100;
}

export function hourOffsetPercent(hour: number): number {
  return offsetPercent(hour * MINUTES_PER_HOUR);
}

/** Clamps an event to the visible window and converts it to CSS percentages. */
export function placeEvent(startMinute: number, endMinute: number): Placement {
  const start = Math.max(dayStartMinute, Math.min(startMinute, dayEndMinute));
  const end = Math.max(start + MIN_EVENT_MINUTES, Math.min(endMinute, dayEndMinute));

  return {
    topPercent: offsetPercent(start),
    heightPercent: Math.max(
      ((end - start) / daySpanMinutes) * 100,
      MIN_EVENT_HEIGHT_PERCENT
    ),
  };
}

export function gridHeightPx(hourHeightPx: number): number {
  return (DAY_END_HOUR - DAY_START_HOUR) * hourHeightPx;
}

export function visibleHours(): number[] {
  const hours: number[] = [];
  for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour++) {
    hours.push(hour);
  }
  return hours;
}
