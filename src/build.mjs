import { context } from "esbuild";
import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { watch as watchDir } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");

/**
 * Each entry is bundled to `_system/scripts/<key>.js`. Templater exposes a
 * script as `tp.user.<basename>`, so keys double as the public API namespace.
 */
const SCRIPT_ENTRIES = {
  dailyCalendar: "src/scripts/daily-calendar/main.ts",
};

const SCRIPTS_OUT_DIR = join(root, "_system/scripts");
const STYLES_SRC_DIR = join(root, "src/styles");
const SNIPPETS_OUT_DIR = join(root, ".obsidian/snippets");

async function copyStyles() {
  await mkdir(SNIPPETS_OUT_DIR, { recursive: true });
  const files = (await readdir(STYLES_SRC_DIR)).filter((f) => f.endsWith(".css"));
  await Promise.all(
    files.map((file) =>
      copyFile(join(STYLES_SRC_DIR, file), join(SNIPPETS_OUT_DIR, file))
    )
  );
  return files;
}

async function createContexts() {
  await rm(SCRIPTS_OUT_DIR, { recursive: true, force: true });
  await mkdir(SCRIPTS_OUT_DIR, { recursive: true });

  return Promise.all(
    Object.entries(SCRIPT_ENTRIES).map(([name, entry]) =>
      context({
        entryPoints: [join(root, entry)],
        outfile: join(SCRIPTS_OUT_DIR, `${name}.js`),
        bundle: true,
        // Templater evaluates scripts inside Obsidian's renderer with a
        // CommonJS shim, so the bundle must be browser-targeted CJS.
        format: "cjs",
        platform: "browser",
        target: "chrome120",
        external: ["obsidian"],
        sourcemap: false,
        minify: false,
        logLevel: "info",
        banner: {
          js: `// Generated from ${entry} by src/build.mjs — do not edit directly.`,
        },
      })
    )
  );
}

const contexts = await createContexts();
const styles = await copyStyles();

if (watch) {
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  watchDir(STYLES_SRC_DIR, { persistent: true }, () => {
    copyStyles().then(
      (copied) => console.log(`[css] copied ${copied.length} snippet(s)`),
      (error) => console.error("[css] copy failed", error)
    );
  });
  console.log("watching src/ for changes…");
} else {
  await Promise.all(
    contexts.map(async (ctx) => {
      await ctx.rebuild();
      await ctx.dispose();
    })
  );
  console.log(
    `built ${Object.keys(SCRIPT_ENTRIES).length} script(s), copied ${styles.length} snippet(s)`
  );
}
