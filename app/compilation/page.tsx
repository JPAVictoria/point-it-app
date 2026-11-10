import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { COMPILATION_PAGE_SIZE, listLayouts } from "@/lib/print-on-top/layout-repository";
import { AuthorBadge, AuthorNameProvider } from "@/components/compilation/AuthorName";
import { CompilationControls } from "@/components/compilation/CompilationControls";
import { LayoutCard } from "@/components/compilation/LayoutCard";
import { NewLayoutButton } from "@/components/compilation/NewLayoutButton";
import { compilationHref, CompilationParams, parseCompilationParams } from "@/components/compilation/params";
import { Icon } from "@/components/print-on-top-editor/ui/Icon";
import { LogoMark } from "@/components/print-on-top-editor/ui/LogoMark";

export const metadata: Metadata = {
  title: "Compilation · Print-on-Top Layout Editor",
};

function Pagination({ params, pageCount }: { params: CompilationParams; pageCount: number }) {
  if (pageCount <= 1) return null;
  const linkClass =
    "inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50";
  const disabledClass = "pointer-events-none opacity-40";
  const prev = params.page > 1;
  const next = params.page < pageCount;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <Link
        href={compilationHref({ ...params, page: params.page - 1 })}
        aria-disabled={!prev}
        tabIndex={prev ? undefined : -1}
        className={`${linkClass} ${prev ? "" : disabledClass}`}
      >
        <Icon name="chevronLeft" size={14} />
        Previous
      </Link>
      <span className="text-xs text-zinc-500 tabular-nums">
        Page {params.page} of {pageCount}
      </span>
      <Link
        href={compilationHref({ ...params, page: params.page + 1 })}
        aria-disabled={!next}
        tabIndex={next ? undefined : -1}
        className={`${linkClass} ${next ? "" : disabledClass}`}
      >
        Next
        <Icon name="chevronRight" size={14} />
      </Link>
    </nav>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-20 text-center">
      {query ? (
        <>
          <p className="text-sm font-medium text-zinc-800">No layouts match “{query}”</p>
          <Link href="/compilation" className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline">
            Clear search
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-zinc-800">No layouts yet</p>
          <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
            Layouts everyone creates show up here. Start one to trace a print-on-top form.
          </p>
          <div className="mt-2">
            <NewLayoutButton label="Create your first layout" />
          </div>
        </>
      )}
    </div>
  );
}

async function CompilationResults({ searchParams }: { searchParams: PageProps<"/compilation">["searchParams"] }) {
  const params = parseCompilationParams(await searchParams);
  const { items, total } = await listLayouts(params);
  const pageCount = Math.max(1, Math.ceil(total / COMPILATION_PAGE_SIZE));

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CompilationControls key={`${params.query}|${params.sort}`} query={params.query} sort={params.sort} />
        <p className="text-xs text-zinc-500 tabular-nums">
          {total} layout{total === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState query={params.query} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((layout) => (
            <LayoutCard key={layout.id} layout={layout} />
          ))}
        </div>
      )}

      <Pagination params={params} pageCount={pageCount} />
    </>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="mb-6 h-8 w-full max-w-md rounded-md bg-zinc-200/60" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
            <div className="flex flex-col gap-2 px-3.5 py-3">
              <div className="h-3 w-2/3 rounded bg-zinc-100" />
              <div className="h-2.5 w-1/2 rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function CompilationPage(props: PageProps<"/compilation">) {
  return (
    <AuthorNameProvider>
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <LogoMark size={26} />
              <span className="text-[13px] font-semibold tracking-tight text-zinc-900">Print-on-Top Layouts</span>
            </div>
            <div className="flex items-center gap-2">
              <AuthorBadge />
              <NewLayoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Compilation</h1>
            <p className="mt-1 text-sm text-zinc-500">Every layout from everyone, in one place.</p>
          </div>
          <Suspense fallback={<ResultsSkeleton />}>
            <CompilationResults searchParams={props.searchParams} />
          </Suspense>
        </main>
      </div>
    </AuthorNameProvider>
  );
}
