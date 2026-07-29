/**
 * Simulates Templater's user-script loader against the built bundles so a
 * refactor cannot silently produce exports Templater refuses to load.
 * See UserScriptFunctions.load_user_script_function in the Templater source.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scriptsDir = join(root, "_system/scripts");

const EXPECTED = {
  "dailyCalendar.js": ["renderDailyNote", "syncWeek"],
};

let failures = 0;

for (const file of await readdir(scriptsDir)) {
  if (!file.endsWith(".js")) continue;

  const source = await readFile(join(scriptsDir, file), "utf8");
  const exports = {};
  const module = { exports };
  const wrapper = new Function("require", "module", "exports", source);

  try {
    wrapper((id) => ({ __stub: id }), module, exports);
  } catch (error) {
    console.error(`✗ ${file}: threw while loading — ${error.message}`);
    failures++;
    continue;
  }

  const exported = exports["default"] ?? module.exports;

  if (typeof exported !== "function" && (typeof exported !== "object" || exported === null)) {
    console.error(`✗ ${file}: export is neither a function nor an object of functions`);
    failures++;
    continue;
  }

  if (typeof exported === "object") {
    const nonFunctions = Object.entries(exported).filter(
      ([, value]) => typeof value !== "function"
    );
    if (nonFunctions.length > 0) {
      console.error(
        `✗ ${file}: exported object has non-function values: ${nonFunctions
          .map(([key]) => key)
          .join(", ")}`
      );
      failures++;
      continue;
    }
  }

  const missing = (EXPECTED[file] ?? []).filter((name) => typeof exported[name] !== "function");
  if (missing.length > 0) {
    console.error(`✗ ${file}: missing expected export(s): ${missing.join(", ")}`);
    failures++;
    continue;
  }

  console.log(`✓ ${file} → tp.user.${file.replace(/\.js$/, "")}.{${Object.keys(exported).join(", ")}}`);
}

if (failures > 0) process.exit(1);
