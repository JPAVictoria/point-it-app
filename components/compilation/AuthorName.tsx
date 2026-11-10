"use client";

import { createContext, FormEvent, ReactNode, useCallback, useContext, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/print-on-top-editor/ui/Button";
import { Dialog } from "@/components/print-on-top-editor/ui/Dialog";
import { TextField } from "@/components/print-on-top-editor/ui/TextField";

/**
 * The app has no logins, so "who made this" is a name people type once and
 * we remember in this browser. An empty string means they chose to skip.
 */
const STORAGE_KEY = "point-it:author-name";
const CHANGE_EVENT = "point-it:author-name-change";

/** undefined = never asked; "" = skipped; otherwise the name. */
function readStoredName(): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStoredName(name: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Private mode / blocked storage: the name just won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The remembered name for display; null on the server and when unknown or skipped. */
export function useStoredAuthorName(): string | null {
  return useSyncExternalStore(subscribe, () => readStoredName() || null, () => null);
}

export type AuthorChoice = { proceed: true; name: string | null } | { proceed: false };

interface AuthorNameContextValue {
  /** Resolves with the name to credit (asking first if never asked), or `proceed: false` if the dialog was closed. */
  requestAuthorName: () => Promise<AuthorChoice>;
  /** Opens the dialog to change the remembered name. */
  editAuthorName: () => void;
}

const AuthorNameContext = createContext<AuthorNameContextValue | null>(null);

export function useAuthorName(): AuthorNameContextValue {
  const value = useContext(AuthorNameContext);
  if (!value) throw new Error("useAuthorName must be used inside <AuthorNameProvider>.");
  return value;
}

export function AuthorNameProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const resolverRef = useRef<((choice: AuthorChoice) => void) | null>(null);

  const requestAuthorName = useCallback((): Promise<AuthorChoice> => {
    const stored = readStoredName();
    if (stored !== undefined) return Promise.resolve({ proceed: true, name: stored || null });
    setDraft("");
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const editAuthorName = useCallback(() => {
    setDraft(readStoredName() ?? "");
    setOpen(true);
  }, []);

  function finish(choice: AuthorChoice) {
    resolverRef.current?.(choice);
    resolverRef.current = null;
    setOpen(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim().slice(0, 60);
    writeStoredName(name);
    finish({ proceed: true, name: name || null });
  }

  function handleSkip() {
    writeStoredName("");
    finish({ proceed: true, name: null });
  }

  return (
    <AuthorNameContext.Provider value={{ requestAuthorName, editAuthorName }}>
      {children}
      <Dialog
        title="What's your name?"
        description="Shown on layouts you create so others in the Compilation know who made them. Remembered in this browser only."
        open={open}
        onClose={() => finish({ proceed: false })}
        widthClassName="max-w-sm"
        footer={
          <>
            <Button onClick={handleSkip}>Skip</Button>
            <Button type="submit" form="author-name-form" variant="primary">
              Continue
            </Button>
          </>
        }
      >
        <form id="author-name-form" onSubmit={handleSubmit}>
          <TextField label="Your name" value={draft} onChange={setDraft} placeholder="e.g. Ana" autoFocus />
        </form>
      </Dialog>
    </AuthorNameContext.Provider>
  );
}

/** "Creating as Ana · Change" in the Compilation header. */
export function AuthorBadge() {
  const name = useStoredAuthorName();
  const { editAuthorName } = useAuthorName();
  return (
    <button
      type="button"
      onClick={editAuthorName}
      className="hidden h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 sm:inline-flex"
    >
      {name ? (
        <>
          Creating as <span className="font-medium text-zinc-800">{name}</span>
        </>
      ) : (
        "Set your name"
      )}
    </button>
  );
}
