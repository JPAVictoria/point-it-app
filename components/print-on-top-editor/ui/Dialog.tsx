import { ReactNode, useEffect } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface DialogProps {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Action row pinned to the bottom of the dialog. */
  footer?: ReactNode;
  widthClassName?: string;
}

export function Dialog({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  widthClassName = "max-w-md",
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      // Controls that consume Escape themselves (e.g. an open select menu) mark it handled.
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 p-4 backdrop-blur-[2px]"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop-in flex max-h-[88vh] w-full ${widthClassName} flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/15`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h2>
            {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-2" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
