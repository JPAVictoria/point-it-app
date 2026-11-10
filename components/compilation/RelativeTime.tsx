"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime } from "@/lib/print-on-top/relative-time";

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/** "3h ago", refreshed every minute. The server renders the plain date so hydration always matches. */
export function RelativeTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatRelativeTime(iso, Date.now()),
    () => iso.slice(0, 10)
  );
  return <time dateTime={iso}>{text}</time>;
}
