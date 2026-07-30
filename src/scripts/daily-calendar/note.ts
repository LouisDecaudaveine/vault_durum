import type { Moment } from "moment";
import { CALENDAR_BLOCK_END, CALENDAR_BLOCK_START, TITLE_FORMAT } from "./config";

const CALENDAR_BLOCK_PATTERN = new RegExp(
  `${CALENDAR_BLOCK_START}[\\s\\S]*?${CALENDAR_BLOCK_END}`
);

const DEFAULT_BODY = `## Notes

## Todos

- [ ] `;

export function buildDailyNote(
  date: Moment,
  calendarBlock: string,
  body = DEFAULT_BODY
): string {
  return `# ${date.format(TITLE_FORMAT)}

${CALENDAR_BLOCK_START}
${calendarBlock}
${CALENDAR_BLOCK_END}

${body.trim()}
`;
}

export function hasCalendarBlock(content: string): boolean {
  return CALENDAR_BLOCK_PATTERN.test(content);
}

export function replaceCalendarBlock(content: string, calendarBlock: string): string {
  return content.replace(
    CALENDAR_BLOCK_PATTERN,
    `${CALENDAR_BLOCK_START}\n${calendarBlock}\n${CALENDAR_BLOCK_END}`
  );
}

export function unmanagedBody(content: string): string {
  const body = content
    .split("\n")
    .filter((line) => !line.startsWith("# "))
    .join("\n")
    .replace(CALENDAR_BLOCK_PATTERN, "")
    .trim();

  return body.length > 0 ? body : DEFAULT_BODY;
}
