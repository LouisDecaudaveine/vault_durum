# vault_durum

An Obsidian vault whose automation is authored as a small TypeScript project.

Daily notes are generated from four published iCloud calendars: the left column is
yours to write in, the right column is a generated time-block calendar for that day.

## Requirements

- [Obsidian](https://obsidian.md) with the **Templater** and **ICS Calendar** community plugins enabled
- Node.js 18+ (only needed to change the automation, not to use the vault)

## Getting started

```bash
npm install
npm run check
```

Then reload Obsidian so it picks up the rebuilt scripts and snippets.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Watch `src/`, rebuild scripts and copy CSS snippets on change |
| `npm run build` | One-off build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Load the built bundles the way Templater does and assert the exports are valid |
| `npm run check` | typecheck → build → verify |
| `npm run hooks:install` | Point git at the tracked hooks in `.githooks/` |

## Layout

```
src/                          TypeScript sources (hidden from Obsidian)
  scripts/daily-calendar/
    main.ts                   public API: renderDailyNote, syncWeek
    config.ts                 visible hours, calendar colors, folder, block markers
    events.ts                 ICS plugin access, all-day vs. timed grouping
    layout.ts                 minute-of-day → CSS percentage math
    note.ts                   note assembly and calendar-block merging
    render.ts                 HTML generation
  styles/                     CSS snippet sources
  types/                      ICS and Templater interfaces
  build.mjs                   esbuild bundler + snippet copier
  verify-bundle.mjs           Templater loader simulation

_system/                      generated + Templater assets (hidden from Obsidian)
  scripts/dailyCalendar.js    build output, exposed as tp.user.dailyCalendar
  templates/                  Templater templates

Daily/  Food/  Glossary.md    vault content
```

`_system/scripts/*.js` and `.obsidian/snippets/*.css` are build artifacts but are
committed on purpose, so the vault works on devices without Node installed.

## How a daily note is produced

1. On Obsidian startup, Templater runs `_system/templates/Startup Sync Week.md`,
   which calls `syncWeek`. It creates missing notes for today plus the next six
   days and refreshes the calendar in the ones that exist.
2. Creating a note in `Daily/` manually runs `_system/templates/Daily Note.md`,
   which calls `renderDailyNote` for that filename's date.
3. Generated calendar HTML lives between `<!-- calendar-auto -->` markers. A
   resync replaces only that block, so anything you write is preserved.
4. A note without those markers is adopted into the two-column layout with its
   existing content moved into the left column.

## Customizing

Most knobs are in `src/scripts/daily-calendar/config.ts`:

- `DAY_START_HOUR` / `DAY_END_HOUR` — visible time window
- `HOUR_HEIGHT_PX` — row height of the grid
- `SYNC_DAYS` — how many days the startup sync covers
- `CALENDAR_COLORS` — keyed by the calendar names in the ICS plugin settings
  (currently `Social`, `work`, `todo`, `holidays`)

Styling lives in `src/styles/daily-note-layout.css`. Run `npm run build` after any
change, then reload Obsidian.

## Adding a user script

1. Create `src/scripts/<name>/main.ts` exporting named async functions.
2. Register it in `SCRIPT_ENTRIES` in `src/build.mjs`.
3. Add its expected exports to `EXPECTED` in `src/verify-bundle.mjs`.
4. Call it from a template as `tp.user.<entryKey>.<fn>()`.

## Constraints worth knowing

- **Templater only loads `.js`**, evaluated in a CommonJS wrapper — hence the build
  step. It also rejects an exported object containing any non-function value, which
  is what `npm run verify` guards against.
- **Scripts are keyed by filename**, ignoring subfolders, so two files with the same
  basename would collide. Bundling one file per namespace avoids this.
- **Dot-folders don't work** for Templater scripts or templates; it uses the Vault
  API, which doesn't index them ([Templater #1645](https://github.com/SilentVoid13/Templater/issues/1645)).
  That is why the hidden folder is `_system` and not `.system`.
- **Obsidian can only dim excluded folders**, not hide them. The
  `hide-tooling-folders` snippet removes `_system`, `src`, `node_modules`, and this
  README from the file explorer; delete a line from it to show one again.

## Vault configuration owned by this project

| File | Purpose |
| --- | --- |
| `.obsidian/plugins/templater-obsidian/data.json` | script folder, template folder, startup template |
| `.obsidian/plugins/ics/data.json` | the four iCloud calendar feeds |
| `.obsidian/daily-notes.json` | daily note folder and template |
| `.obsidian/appearance.json` | enabled CSS snippets |
| `.obsidian/app.json` | `userIgnoreFilters` for search and graph |
