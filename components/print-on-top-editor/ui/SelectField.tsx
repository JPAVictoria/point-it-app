import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { CONTROL_CLASS, LABEL_CLASS } from "./styles";

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary text shown right-aligned, e.g. dimensions. */
  hint?: string;
  /** Options sharing a group are listed under a heading; keep them adjacent. */
  group?: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const MENU_MAX_HEIGHT = 300;
const MENU_GAP = 4;

interface MenuPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

function computeMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(rect.width, 240);
  const left = Math.min(rect.left, window.innerWidth - width - 8);
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow) {
    return { left, width, bottom: window.innerHeight - rect.top + MENU_GAP };
  }
  return { left, width, top: rect.bottom + MENU_GAP };
}

/**
 * Custom listbox replacing the native <select>. The menu renders in a
 * portal with fixed positioning so it is never clipped by scrolling
 * dialogs or panels; it closes on outside click, scroll, or resize.
 */
export function SelectField({ label, value, options, onChange, placeholder = "Select…" }: SelectFieldProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const menuId = useId();

  const open = position !== null;
  const selected = options.find((o) => o.value === value) ?? null;

  function openMenu() {
    if (!triggerRef.current) return;
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setPosition(computeMenuPosition(triggerRef.current));
  }

  function closeMenu() {
    setPosition(null);
    triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    closeMenu();
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPosition(null);
    }
    function handleViewportChange(e: Event) {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      setPosition(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        // Keep the Escape from also closing a surrounding dialog.
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
        break;
      case "Tab":
        setPosition(null);
        break;
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span id={labelId} className={LABEL_CLASS}>
          {label}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={label ? labelId : undefined}
        aria-expanded={open}
        aria-controls={menuId}
        aria-activedescendant={open ? `${menuId}-${activeIndex}` : undefined}
        onClick={() => (open ? setPosition(null) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`${CONTROL_CLASS} flex cursor-pointer items-center justify-between gap-2 text-left ${open ? "border-zinc-400 ring-3 ring-zinc-900/5" : ""}`}
      >
        <span className={`truncate ${selected ? "" : "text-zinc-400"}`}>
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={14}
          className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="listbox"
              aria-labelledby={label ? labelId : undefined}
              className="animate-fade-in fixed z-[60] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10"
              style={{ ...position, maxHeight: MENU_MAX_HEIGHT }}
            >
              {options.map((option, index) => {
                const showGroup = option.group && option.group !== options[index - 1]?.group;
                const isSelected = option.value === value;
                return (
                  <div key={option.value}>
                    {showGroup ? (
                      <div
                        className={`px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase ${index > 0 ? "mt-1 border-t border-zinc-100" : ""}`}
                      >
                        {option.group}
                      </div>
                    ) : null}
                    <div
                      id={`${menuId}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onPointerMove={() => setActiveIndex(index)}
                      onClick={() => choose(index)}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                        index === activeIndex ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
                      }`}
                    >
                      <Icon
                        name="check"
                        size={14}
                        className={isSelected ? "text-zinc-900" : "invisible"}
                      />
                      <span className="flex-1 truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                          {option.hint}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
