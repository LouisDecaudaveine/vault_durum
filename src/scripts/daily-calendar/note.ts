import type { Moment } from "moment";
import { CALENDAR_BLOCK_END, CALENDAR_BLOCK_START, TITLE_FORMAT } from "./config";

const CALENDAR_BLOCK_PATTERN = new RegExp(
  `${CALENDAR_BLOCK_START}[\\s\\S]*?${CALENDAR_BLOCK_END}`
);

const DEFAULT_LEFT_BODY = `## Notes

## Todos

- [ ] `;

/** Assembles the two-column note: free-form content left, generated calendar right. */
export function buildDailyNote(
  date: Moment,
  calendarHtml: string,
  leftBody = DEFAULT_LEFT_BODY
): string {
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

export function hasCalendarBlock(content: string): boolean {
  return CALENDAR_BLOCK_PATTERN.test(content);
}

/** Swaps in fresh calendar HTML, leaving everything the user wrote untouched. */
export function replaceCalendarBlock(content: string, calendarHtml: string): string {
  return content.replace(
    CALENDAR_BLOCK_PATTERN,
    `${CALENDAR_BLOCK_START}\n${calendarHtml}\n${CALENDAR_BLOCK_END}`
  );
}

/**
 * Content of a note that predates the managed layout, so adopting it into the
 * two-column template does not lose anything. The title heading is dropped
 * because `buildDailyNote` regenerates it.
 */
export function unmanagedBody(content: string): string {
  const body = content
    .split("\n")
    .filter((line) => !line.startsWith("# "))
    .join("\n")
    .trim();

  return body.length > 0 ? body : DEFAULT_LEFT_BODY;
}
