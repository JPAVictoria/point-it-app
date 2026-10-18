import { useCallback, useRef, useState } from "react";
import { LayoutConfig } from "@/lib/print-on-top/types";

const HISTORY_LIMIT = 50;

/**
 * Manages a LayoutConfig with undo/redo history.
 *
 * Discrete edits (add/delete field, property panel changes, page size
 * changes) should call `commit`, which pushes the pre-edit state onto the
 * undo stack. Continuous gestures (dragging a field) should call
 * `beginGesture` once at pointerdown, then `setLive` on every pointermove
 * (no history push), then `endGesture` on pointerup to push a single
 * history entry for the whole drag.
 */
export function useLayoutHistory(initial: LayoutConfig) {
  const [layout, setLayoutState] = useState(initial);
  const [past, setPast] = useState<LayoutConfig[]>([]);
  const [future, setFuture] = useState<LayoutConfig[]>([]);
  const gestureSnapshot = useRef<LayoutConfig | null>(null);

  const commit = useCallback(
    (updater: (current: LayoutConfig) => LayoutConfig) => {
      setLayoutState((current) => {
        setPast((p) => [...p.slice(-HISTORY_LIMIT + 1), current]);
        setFuture([]);
        return updater(current);
      });
    },
    []
  );

  const setLive = useCallback((updater: (current: LayoutConfig) => LayoutConfig) => {
    setLayoutState(updater);
  }, []);

  const beginGesture = useCallback(() => {
    setLayoutState((current) => {
      gestureSnapshot.current = current;
      return current;
    });
  }, []);

  const endGesture = useCallback(() => {
    setLayoutState((current) => {
      const before = gestureSnapshot.current;
      gestureSnapshot.current = null;
      if (before && before !== current) {
        setPast((p) => [...p.slice(-HISTORY_LIMIT + 1), before]);
        setFuture([]);
      }
      return current;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setLayoutState((current) => {
        setFuture((f) => [current, ...f]);
        return previous;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setLayoutState((current) => {
        setPast((p) => [...p, current]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  const replaceAll = useCallback((next: LayoutConfig) => {
    setLayoutState(next);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    layout,
    commit,
    setLive,
    beginGesture,
    endGesture,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    replaceAll,
  };
}
