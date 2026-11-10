import { useSyncExternalStore } from "react";

/** A key combo; "mod" is ⌘ on macOS and Ctrl elsewhere. */
export type ShortcutKeys = string[];

export const SHORTCUTS: { group: string; items: { label: string; keys: ShortcutKeys[] }[] }[] = [
  {
    group: "General",
    items: [
      { label: "Undo", keys: [["mod", "Z"]] },
      { label: "Redo", keys: [["mod", "shift", "Z"], ["mod", "Y"]] },
      { label: "Save now (autosaves anyway)", keys: [["mod", "S"]] },
      { label: "Preview PDF (print dialog)", keys: [["mod", "P"]] },
      { label: "Show shortcuts", keys: [["?"]] },
    ],
  },
  {
    group: "Fields",
    items: [
      { label: "Add text", keys: [["T"]] },
      { label: "Duplicate field", keys: [["mod", "D"]] },
      { label: "Delete field", keys: [["Delete"], ["Backspace"]] },
      { label: "Nudge 1 pt", keys: [["←↑→↓"]] },
      { label: "Nudge 10 pt", keys: [["shift", "←↑→↓"]] },
      { label: "Deselect / cancel", keys: [["Esc"]] },
    ],
  },
  {
    group: "Image",
    items: [
      { label: "Adjust image", keys: [["Click image"]] },
      { label: "Free resize from a corner", keys: [["shift", "Drag"]] },
      { label: "Delete image (while selected)", keys: [["Delete"], ["Backspace"]] },
      { label: "Finish adjusting", keys: [["Enter"]] },
      { label: "Cancel adjusting", keys: [["Esc"]] },
    ],
  },
  {
    group: "View",
    items: [
      { label: "Zoom in", keys: [["mod", "+"]] },
      { label: "Zoom out", keys: [["mod", "−"]] },
      { label: "Fit to screen", keys: [["mod", "0"]] },
    ],
  },
];

function subscribe() {
  return () => {};
}

/** True on macOS/iOS. Server render and first client render both assume non-Mac to avoid hydration mismatches. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false
  );
}

const MAC_SYMBOLS: Record<string, string> = { mod: "⌘", shift: "⇧", alt: "⌥" };
const PC_NAMES: Record<string, string> = { mod: "Ctrl", shift: "Shift", alt: "Alt" };

/** Splits a combo into display parts, e.g. ["mod","shift","Z"] → ["⌘","⇧","Z"] on Mac, ["Ctrl","Shift","Z"] elsewhere. */
export function shortcutParts(keys: ShortcutKeys, isMac: boolean): string[] {
  return keys.map((k) => (isMac ? MAC_SYMBOLS[k] : PC_NAMES[k]) ?? k);
}

/** One-line label for tooltips: "⌘⇧Z" on Mac, "Ctrl+Shift+Z" elsewhere. */
export function formatShortcut(keys: ShortcutKeys, isMac: boolean): string {
  return shortcutParts(keys, isMac).join(isMac ? "" : "+");
}

/** True when the key event comes from somewhere the user is typing, so editor shortcuts must stay out of the way. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}
