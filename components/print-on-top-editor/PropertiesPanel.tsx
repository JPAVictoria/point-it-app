import { LengthUnit, StandardFontFamily, TextAlignment, TextField as TextFieldModel } from "@/lib/print-on-top/types";
import { fromPoints, roundForUnit, toPoints } from "@/lib/print-on-top/units";
import { STANDARD_FONT_FAMILIES } from "@/lib/print-on-top/pdf-renderer";
import { Button } from "./ui/Button";
import { NumberField } from "./ui/NumberField";
import { SelectField } from "./ui/SelectField";
import { TextField } from "./ui/TextField";

interface PropertiesPanelProps {
  field: TextFieldModel | null;
  unit: LengthUnit;
  onChange: (patch: Partial<TextFieldModel>) => void;
  onDelete: () => void;
}

const ALIGNMENTS: TextAlignment[] = ["left", "center", "right"];

export function PropertiesPanel({ field, unit, onChange, onDelete }: PropertiesPanelProps) {
  if (!field) {
    return (
      <aside className="w-72 shrink-0 border-l border-zinc-200 p-4 text-sm text-zinc-400">
        Select a field to edit its properties, or add a new one from the toolbar.
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Field properties</h3>
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <TextField
        label="Field name (data key)"
        value={field.name}
        onChange={(name) => onChange({ name })}
      />
      <TextField label="Label" value={field.label} onChange={(label) => onChange({ label })} />
      <TextField
        label="Sample value"
        value={field.sampleValue}
        onChange={(sampleValue) => onChange({ sampleValue })}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={`X (${unit})`}
          value={roundForUnit(fromPoints(field.x, unit), unit)}
          step={unit === "pt" ? 1 : 0.05}
          onChange={(v) => onChange({ x: toPoints(v, unit) })}
        />
        <NumberField
          label={`Y (${unit})`}
          value={roundForUnit(fromPoints(field.y, unit), unit)}
          step={unit === "pt" ? 1 : 0.05}
          onChange={(v) => onChange({ y: toPoints(v, unit) })}
        />
      </div>
      <p className="text-[11px] leading-snug text-zinc-400">
        X/Y is the top-left corner of the text, measured from the page&apos;s top-left corner.
      </p>

      <NumberField
        label="Font size (pt)"
        value={field.fontSize}
        min={1}
        onChange={(fontSize) => onChange({ fontSize: Math.max(1, fontSize) })}
      />

      <SelectField
        label="Font family"
        value={field.fontFamily}
        options={STANDARD_FONT_FAMILIES.map((f) => ({ value: f, label: f }))}
        onChange={(fontFamily) => onChange({ fontFamily: fontFamily as StandardFontFamily })}
      />

      <SelectField
        label="Alignment"
        value={field.alignment}
        options={ALIGNMENTS.map((a) => ({ value: a, label: a }))}
        onChange={(alignment) => onChange({ alignment: alignment as TextAlignment })}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={`Max width (${unit})`}
          value={field.maxWidth ? roundForUnit(fromPoints(field.maxWidth, unit), unit) : 0}
          step={unit === "pt" ? 1 : 0.05}
          onChange={(v) => onChange({ maxWidth: v > 0 ? toPoints(v, unit) : undefined })}
        />
        <NumberField
          label={`Max height (${unit})`}
          value={field.maxHeight ? roundForUnit(fromPoints(field.maxHeight, unit), unit) : 0}
          step={unit === "pt" ? 1 : 0.05}
          onChange={(v) => onChange({ maxHeight: v > 0 ? toPoints(v, unit) : undefined })}
        />
      </div>
      <p className="text-[11px] leading-snug text-zinc-400">
        Set to 0 to leave unconstrained. Max width enables word wrapping; max height limits how
        many wrapped lines are drawn.
      </p>

      <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
        <input
          type="checkbox"
          checked={field.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Enabled (included when rendering)
      </label>
    </aside>
  );
}
