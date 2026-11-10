"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLayoutAction } from "@/app/actions/layouts";
import { Button } from "@/components/print-on-top-editor/ui/Button";
import { Icon } from "@/components/print-on-top-editor/ui/Icon";
import { useAuthorName } from "./AuthorName";

export function NewLayoutButton({ label = "New layout" }: { label?: string }) {
  const router = useRouter();
  const { requestAuthorName } = useAuthorName();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const choice = await requestAuthorName();
    if (!choice.proceed) return;
    setCreating(true);
    setError(null);
    const result = await createLayoutAction(choice.name);
    if (result.ok) {
      router.push(`/layouts/${result.data.id}`);
      return;
    }
    setError(result.error);
    setCreating(false);
  }

  return (
    <span className="relative inline-flex flex-col items-end">
      <Button variant="primary" disabled={creating} onClick={handleClick}>
        <Icon name="plus" size={15} />
        {creating ? "Creating…" : label}
      </Button>
      {error ? (
        <span className="absolute top-full right-0 mt-1.5 w-64 rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] text-red-700 shadow-sm">
          {error}
        </span>
      ) : null}
    </span>
  );
}
