import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Layout not found</h1>
      <p className="max-w-sm text-sm text-zinc-500">It may have been deleted, or the link is wrong.</p>
      <Link
        href="/compilation"
        className="mt-2 inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800"
      >
        Back to Compilation
      </Link>
    </main>
  );
}
