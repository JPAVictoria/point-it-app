import { shortcutParts, SHORTCUTS, useIsMac } from "./shortcuts";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const isMac = useIsMac();

  return (
    <Dialog
      title="Keyboard shortcuts"
      description={isMac ? "Shown for Mac. On Windows, use Ctrl instead of ⌘." : "Shown for Windows. On Mac, use ⌘ instead of Ctrl."}
      open={open}
      onClose={onClose}
      widthClassName="max-w-2xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {SHORTCUTS.map(({ group, items }) => (
          <section key={group}>
            <h3 className="mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">{group}</h3>
            <ul className="flex flex-col">
              {items.map(({ label, keys }) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-b-0"
                >
                  <span className="text-[13px] text-zinc-700">{label}</span>
                  <span className="flex items-center gap-1.5">
                    {keys.map((combo, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 ? <span className="text-[10px] text-zinc-400">or</span> : null}
                        {shortcutParts(combo, isMac).map((part) => (
                          <kbd
                            key={part}
                            className="min-w-5 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-center font-mono text-[10px] text-zinc-600 shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                          >
                            {part}
                          </kbd>
                        ))}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
