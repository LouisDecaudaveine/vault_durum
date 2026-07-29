import type { App } from "obsidian";

/**
 * The subset of Templater's `tp` object that our scripts rely on. Templater
 * ships no published types, so we declare only what we use.
 */
export interface Templater {
  app: App;
  file: {
    title: string;
  };
}
