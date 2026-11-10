import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Editor } from "@/components/print-on-top-editor/Editor";
import { getLayout } from "@/lib/print-on-top/layout-repository";
import { isUuid } from "@/lib/print-on-top/layout-validation";

async function LayoutEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const result = await getLayout(id);
  if (!result) notFound();
  // Keyed by id so moving between layouts starts from fresh editor state.
  return <Editor key={result.layout.id} initialLayout={result.layout} initialImageUrl={result.imageUrl} />;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-12 shrink-0 border-b border-zinc-200 bg-white" />
      <div className="flex flex-1 items-center justify-center text-xs text-zinc-400">Loading layout…</div>
    </div>
  );
}

export default function LayoutPage(props: PageProps<"/layouts/[id]">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100">
      <Suspense fallback={<EditorSkeleton />}>
        <LayoutEditor params={props.params} />
      </Suspense>
    </div>
  );
}
