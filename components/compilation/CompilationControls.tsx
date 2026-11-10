"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/print-on-top-editor/ui/Button";
import { Icon } from "@/components/print-on-top-editor/ui/Icon";
import { SelectField } from "@/components/print-on-top-editor/ui/SelectField";
import { CONTROL_CLASS } from "@/components/print-on-top-editor/ui/styles";
import { compilationHref, CompilationParams } from "./params";

const SORT_OPTIONS = [
  { value: "updated", label: "Last edited" },
  { value: "created", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
];

/** Search (submitted with the button or Enter) and sort. Both reset to page 1. */
export function CompilationControls({ query, sort }: Pick<CompilationParams, "query" | "sort">) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    router.push(compilationHref({ query: draft.trim(), sort, page: 1 }));
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
        <div className="relative flex-1 sm:max-w-sm">
          <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search layouts by name"
            aria-label="Search layouts by name"
            maxLength={100}
            className={`${CONTROL_CLASS} pl-8`}
          />
        </div>
        <Button type="submit">Search</Button>
        {query ? (
          <Button
            variant="ghost"
            onClick={() => {
              setDraft("");
              router.push(compilationHref({ query: "", sort, page: 1 }));
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>
      <div className="w-44">
        <SelectField
          value={sort}
          options={SORT_OPTIONS}
          onChange={(next) => router.push(compilationHref({ query, sort: next as CompilationParams["sort"], page: 1 }))}
        />
      </div>
    </div>
  );
}
