"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/print-on-top-editor/ui/Icon";

/** Shown when a page fails to load data — most often because Supabase isn't configured or is paused. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const router = useRouter();
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Couldn&apos;t load this page</h1>
      <p className="max-w-md text-sm leading-relaxed text-zinc-500">
        The database didn&apos;t respond. If the app was just deployed, check that{" "}
        <code className="font-mono text-xs">DATABASE_URL</code>,{" "}
        <code className="font-mono text-xs">SUPABASE_URL</code> and{" "}
        <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> are set. Free Supabase projects also
        pause after a week without visits — resume it from the Supabase dashboard.
      </p>
      {digest ? <p className="font-mono text-[11px] text-zinc-400">Reference: {digest}</p> : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white pr-3 pl-2 text-[13px] font-medium text-zinc-800 shadow-xs hover:bg-zinc-50"
        >
          <Icon name="chevronLeft" size={14} />
          Back
        </button>
        <Link
          href="/compilation"
          className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 shadow-xs hover:bg-zinc-50"
        >
          Compilation
        </Link>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-8 cursor-pointer items-center rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
