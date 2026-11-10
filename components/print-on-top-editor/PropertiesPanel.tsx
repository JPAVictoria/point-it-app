import { FormEvent, ReactNode, useState } from "react";
import {
  LengthUnit,
  StandardFontFamily,
  TextAlignment,
  TextField as TextFieldModel,
} from "@/lib/print-on-top/types";
import { fromPoints, roundForUnit, toPoints } from "@/lib/print-on-top/units";
import { STANDARD_FONT_FAMILIES } from "@/lib/print-on-top/pdf-renderer";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { NumberField } from "./ui/NumberField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { SelectField } from "./ui/SelectField";
import { Switch } from "./ui/Switch";
import { TextField } from "./ui/TextField";

interface PropertiesPanelProps {
  fields: TextFieldModel[];
  selectedField: TextFieldModel | null;
  unit: LengthUnit;
  onSelectField: (id: string) => void;
  onChange: (patch: Partial<TextFieldModel>) => void;
  onDelete: () => void;
}

const ALIGNMENTS: { value: TextAlignment; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const FONT_OPTIONS = STANDARD_FONT_FAMILIES.map((f) => ({
  value: f,
  label: f.replace("-", " "),
  group: f.startsWith("Times") ? "Times" : f.startsWith("Courier") ? "Courier" : "Helvetica",
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 last:border-b-0">
      <h4 className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">{title}</h4>
      {children}
    </section>
  );
}

function isDirty(draft: TextFieldModel, field: TextFieldModel): boolean {
  const keys = new Set([...Object.keys(draft), ...Object.keys(field)]) as Set<keyof TextFieldModel>;
  return [...keys].some((key) => draft[key] !== field[key]);
}

/**
 * Edits a copy of the field; nothing reaches the layout until "Apply".
 * Re-mounted (via key) whenever the committed field changes — e.g. after a
 * drag or undo — so the draft always starts from the current values.
 */
function FieldForm({
  field,
  unit,
  onChange,
  onDelete,
}: {
  field: TextFieldModel;
  unit: LengthUnit;
  onChange: (patch: Partial<TextFieldModel>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(field);
  const dirty = isDirty(draft, field);
  const lengthStep = unit === "pt" ? 1 : 0.05;

  function update(patch: Partial<TextFieldModel>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    onChange(draft);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Content">
          <TextField label="Text" value={draft.sampleValue} onChange={(sampleValue) => update({ sampleValue })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Data key" mono value={draft.name} onChange={(name) => update({ name })} />
            <TextField label="Label" value={draft.label} onChange={(label) => update({ label })} />
          </div>
        </Section>

        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="X"
              suffix={unit}
              value={roundForUnit(fromPoints(draft.x, unit), unit)}
              step={lengthStep}
              min={0}
              onChange={(v) => update({ x: toPoints(v, unit) })}
            />
            <NumberField
              label="Y"
              suffix={unit}
              value={roundForUnit(fromPoints(draft.y, unit), unit)}
              step={lengthStep}
              min={0}
              onChange={(v) => update({ y: toPoints(v, unit) })}
            />
          </div>
          <p className="text-[11px] leading-snug text-zinc-400">Top-left of the text, from the page&apos;s top-left.</p>
        </Section>

        <Section title="Typography">
          <SelectField
            label="Font"
            value={draft.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) => update({ fontFamily: fontFamily as StandardFontFamily })}
          />
          <div className="grid grid-cols-[88px_1fr] gap-2">
            <NumberField
              label="Size"
              suffix="pt"
              value={draft.fontSize}
              min={1}
              step={0.5}
              onChange={(fontSize) => update({ fontSize: Math.max(1, fontSize) })}
            />
            <SegmentedControl
              label="Align"
              value={draft.alignment}
              options={ALIGNMENTS}
              onChange={(alignment) => update({ alignment })}
            />
          </div>
        </Section>

        <Section title="Bounds">
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Max width"
              suffix={unit}
              value={draft.maxWidth ? roundForUnit(fromPoints(draft.maxWidth, unit), unit) : 0}
              step={lengthStep}
              min={0}
              onChange={(v) => update({ maxWidth: v > 0 ? toPoints(v, unit) : undefined })}
            />
            <NumberField
              label="Max height"
              suffix={unit}
              value={draft.maxHeight ? roundForUnit(fromPoints(draft.maxHeight, unit), unit) : 0}
              step={lengthStep}
              min={0}
              onChange={(v) => update({ maxHeight: v > 0 ? toPoints(v, unit) : undefined })}
            />
          </div>
          <p className="text-[11px] leading-snug text-zinc-400">
            0 means unconstrained. Max width wraps words; max height caps the wrapped lines.
          </p>
        </Section>

        <Section title="Output">
          <Switch
            label="Include in PDF and export"
            checked={draft.enabled}
            onChange={(enabled) => update({ enabled })}
          />
        </Section>
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-200 bg-white px-4 py-3">
        <Button variant="ghost-danger" className="-ml-2" onClick={onDelete}>
          <Icon name="trash" size={15} />
          Delete
        </Button>
        <div className="flex-1" />
        <Button disabled={!dirty} onClick={() => setDraft(field)}>
          Discard
        </Button>
        <Button type="submit" variant="primary" disabled={!dirty}>
          Apply
        </Button>
      </div>
    </form>
  );
}

export function PropertiesPanel({
  fields,
  selectedField,
  unit,
  onSelectField,
  onChange,
  onDelete,
}: PropertiesPanelProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">Fields</h3>
        <span className="rounded-full bg-zinc-100 px-1.5 font-mono text-[10px] leading-4 text-zinc-500">
          {fields.length}
        </span>
      </div>

      {fields.length === 0 ? (
        <p className="px-4 pb-4 text-xs leading-relaxed text-zinc-400">
          No fields yet. Choose <span className="font-medium text-zinc-600">Add text</span>, then click on
          the page.
        </p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-px overflow-y-auto px-2 pb-2">
          {fields.map((f) => {
            const active = f.id === selectedField?.id;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelectField(f.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                    active ? "bg-zinc-100" : "hover:bg-zinc-50"
                  } ${f.enabled ? "" : "opacity-50"}`}
                >
                  <Icon name="text" size={13} className="text-zinc-400" />
                  <span className="flex-1 truncate text-[13px] text-zinc-800">
                    {f.sampleValue || f.label}
                  </span>
                  <span className="max-w-24 truncate font-mono text-[10px] text-zinc-400">{f.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-zinc-200" />

      {selectedField ? (
        <FieldForm
          key={JSON.stringify(selectedField)}
          field={selectedField}
          unit={unit}
          onChange={onChange}
          onDelete={onDelete}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <Icon name="cursor" size={18} className="text-zinc-300" />
          <p className="text-xs leading-relaxed text-zinc-400">Select a field to edit its properties.</p>
        </div>
      )}
    </aside>
  );
}
