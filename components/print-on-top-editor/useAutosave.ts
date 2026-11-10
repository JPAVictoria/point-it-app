import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutConfig, LayoutContent } from "@/lib/print-on-top/types";
import { saveLayoutAction } from "@/app/actions/layouts";

const SAVE_DELAY_MS = 1500;
const RETRY_DELAY_MS = 5000;

export type SaveStatus =
  /** Everything is stored. */
  | "saved"
  /** Changes are waiting for the debounce. */
  | "unsaved"
  | "saving"
  /** The last attempt failed; another is scheduled. */
  | "retrying"
  /** Someone saved this layout elsewhere; saving is paused until the user picks Reload or Overwrite. */
  | "conflict"
  /** Saving can't continue (e.g. the layout was deleted). */
  | "failed";

function toContent(layout: LayoutConfig): LayoutContent {
  return { name: layout.name, page: layout.page, fields: layout.fields, background: layout.background };
}

/**
 * Saves the layout to Supabase ~1.5 s after the last change. Only one save
 * runs at a time; changes made during a save are picked up right after it.
 * Each save carries the version it was based on, so edits from another tab
 * or person surface as a conflict instead of being silently overwritten.
 */
export function useAutosave(layout: LayoutConfig) {
  const [savedLayout, setSavedLayout] = useState(layout);
  const [phase, setPhase] = useState<"idle" | "saving" | "retrying" | "conflict" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);

  const latestRef = useRef(layout);
  const savedRef = useRef(layout);
  const versionRef = useRef(layout.version);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const blockedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestRef.current = layout;
  }, [layout]);

  const save = useCallback((overwrite = false) => {
    async function attempt(overwrite = false): Promise<void> {
      if (blockedRef.current && !overwrite) return;
      if (inFlightRef.current) {
        queuedRef.current = true;
        return;
      }
      const target = latestRef.current;
      if (!overwrite && target === savedRef.current) return;

      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      inFlightRef.current = true;
      setPhase("saving");

      const result = await saveLayoutAction(target.id, overwrite ? null : versionRef.current, toContent(target)).catch(
        () => ({ ok: false as const, error: "You appear to be offline." })
      );
      inFlightRef.current = false;

      if (!result.ok) {
        setError(result.error);
        setPhase("retrying");
        retryTimerRef.current = setTimeout(() => void attempt(), RETRY_DELAY_MS);
        return;
      }

      switch (result.data.status) {
        case "saved":
          versionRef.current = result.data.version;
          savedRef.current = target;
          blockedRef.current = false;
          setSavedLayout(target);
          setError(null);
          setPhase("idle");
          if (queuedRef.current || latestRef.current !== target) {
            queuedRef.current = false;
            void attempt();
          }
          return;
        case "conflict":
          blockedRef.current = true;
          setPhase("conflict");
          return;
        case "not_found":
          blockedRef.current = true;
          setError("This layout was deleted, so changes can't be saved.");
          setPhase("failed");
          return;
      }
    }
    return attempt(overwrite);
  }, []);

  // Debounce: every change restarts the timer.
  useEffect(() => {
    if (layout === savedRef.current) return;
    const timer = setTimeout(() => void save(), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [layout, save]);

  const dirty = layout !== savedLayout;

  // Browser "Leave site?" prompt while something isn't stored yet.
  useEffect(() => {
    if (!dirty && phase !== "saving") return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, phase]);

  // Leaving the editor through an in-app link doesn't fire beforeunload: send any pending change on the way out.
  useEffect(
    () => () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const pending = latestRef.current;
      if (pending !== savedRef.current && !blockedRef.current) {
        void saveLayoutAction(pending.id, versionRef.current, toContent(pending));
      }
    },
    []
  );

  let status: SaveStatus;
  if (phase === "conflict" || phase === "failed" || phase === "saving" || phase === "retrying") status = phase;
  else status = dirty ? "unsaved" : "saved";

  return {
    status,
    error,
    /** Save now instead of waiting for the debounce (⌘S / Ctrl+S). */
    saveNow: () => void save(),
    /** Resolve a conflict by replacing the stored layout with this one. */
    overwrite: () => void save(true),
  };
}
