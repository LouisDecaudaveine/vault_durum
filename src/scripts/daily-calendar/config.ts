export const DAILY_FOLDER = "Daily";
export const DAILY_DATE_FORMAT = "YYYY-MM-DD";
export const TITLE_FORMAT = "dddd, MMMM D, YYYY";

/** Number of days (including today) refreshed by `syncWeek`. */
export const SYNC_DAYS = 7;

/** Visible time window of the day grid. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 23;

/** Rendered height of a single hour row. */
export const HOUR_HEIGHT_PX = 48;

/** Markers delimiting the generated block, so hand-written content survives a resync. */
export const CALENDAR_BLOCK_START = "<!-- calendar-auto -->";
export const CALENDAR_BLOCK_END = "<!-- /calendar-auto -->";

export interface CalendarColor {
  bg: string;
  border: string;
}

/** Keyed by the calendar name configured in the ICS plugin. */
export const CALENDAR_COLORS: Record<string, CalendarColor> = {
  Social: { bg: "rgba(235, 120, 154, 0.28)", border: "#eb789a" },
  work: { bg: "rgba(99, 145, 235, 0.28)", border: "#6391eb" },
  todo: { bg: "rgba(99, 200, 130, 0.28)", border: "#63c882" },
  holidays: { bg: "rgba(180, 120, 235, 0.28)", border: "#b478eb" },
};

export const DEFAULT_CALENDAR_COLOR: CalendarColor = {
  bg: "rgba(140, 140, 160, 0.28)",
  border: "#8c8ca0",
};
