import type { CompilationSort } from "@/lib/print-on-top/layout-repository";

export interface CompilationParams {
  query: string;
  sort: CompilationSort;
  page: number;
}

const SORTS: CompilationSort[] = ["updated", "created", "name"];
const MAX_QUERY_LENGTH = 100;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads ?q=&sort=&page= defensively; anything unexpected falls back to the default. */
export function parseCompilationParams(raw: Record<string, string | string[] | undefined>): CompilationParams {
  const sort = first(raw.sort) as CompilationSort;
  const page = Number.parseInt(first(raw.page), 10);
  return {
    query: first(raw.q).trim().slice(0, MAX_QUERY_LENGTH),
    sort: SORTS.includes(sort) ? sort : "updated",
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
  };
}

/** Builds a Compilation URL, leaving defaults out so links stay short. */
export function compilationHref({ query, sort, page }: CompilationParams): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (sort !== "updated") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/compilation?${search}` : "/compilation";
}
