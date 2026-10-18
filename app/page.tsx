import { Suspense } from "react";
import { Editor } from "@/components/print-on-top-editor/Editor";

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50">
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
    </div>
  );
}
