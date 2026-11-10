import { useState } from "react";
import { BackgroundImage, LengthUnit, PageSize } from "@/lib/print-on-top/types";
import { formatDimensions, fromPoints, roundForUnit, toPoints } from "@/lib/print-on-top/units";
import { findPreset, PAPER_PRESETS } from "@/lib/print-on-top/paper-sizes";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { NumberField } from "./ui/NumberField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { SelectField } from "./ui/SelectField";

interface PageSizeDialogProps {
  open: boolean;
  onClose: () => void;
  page: PageSize;
  background: BackgroundImage | null;
  onApply: (page: PageSize, fitMode: BackgroundImage["fitMode"] | null) => void;
}

const UNITS: { value: LengthUnit; label: string }[] = [
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
  { value: "mm", label: "mm" },
  { value: "pt", label: "pt" },
];

const CUSTOM = "__custom__";

function aspectMismatch(widthPt: number, heightPt: number, background: BackgroundImage | null): boolean {
  if (!background) return false;
  const pageRatio = widthPt / heightPt;
  const imageRatio = background.naturalWidthPx / background.naturalHeightPx;
  return Math.abs(pageRatio - imageRatio) / pageRatio > 0.05;
}

/** Mounted fresh each time the dialog opens, so the draft always starts from the current page. */
function PageSizeForm({ onClose, page, background, onApply }: Omit<PageSizeDialogProps, "open">) {
  const [widthPt, setWidthPt] = useState(page.widthPt);
  const [heightPt, setHeightPt] = useState(page.heightPt);
  const [unit, setUnit] = useState(page.displayUnit);
  const [fitMode, setFitMode] = useState(background?.fitMode ?? "contain");

  const orientation = widthPt > heightPt ? "landscape" : "portrait";
  const preset = findPreset(widthPt, heightPt);
  // A manually adjusted image isn't governed by fit mode, so there's nothing to choose.
  const mismatch = !background?.frame && aspectMismatch(widthPt, heightPt, background);
  const step = unit === "pt" ? 1 : 0.01;

  const presetOptions = [
    { value: CUSTOM, label: "Custom size" },
    ...PAPER_PRESETS.map((p) => ({
      value: p.name,
      label: p.name,
      group: p.group,
      hint: formatDimensions(p.widthPt, p.heightPt, unit),
    })),
  ];

  function applyPreset(name: string) {
    const found = PAPER_PRESETS.find((p) => p.name === name);
    if (!found) return;
    // Standard sizes follow the current orientation; Oboda form sizes are used exactly as defined.
    const swap = found.group === "Standard" && orientation === "landscape";
    setWidthPt(swap ? found.heightPt : found.widthPt);
    setHeightPt(swap ? found.widthPt : found.heightPt);
  }

  function setOrientation(next: "portrait" | "landscape") {
    if (next === orientation) return;
    setWidthPt(heightPt);
    setHeightPt(widthPt);
  }

  function handleApply() {
    onApply({ widthPt, heightPt, displayUnit: unit, orientation }, background ? fitMode : null);
    onClose();
  }

  return (
    <Dialog
      title="Page size"
      description="Match the physical size of the pre-printed form."
      open
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleApply}>
            Apply
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleApply();
        }}
      >
        <SelectField
          label="Preset"
          value={preset?.name ?? CUSTOM}
          options={presetOptions}
          onChange={applyPreset}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Width"
            suffix={unit}
            value={roundForUnit(fromPoints(widthPt, unit), unit)}
            step={step}
            min={0.1}
            onChange={(v) => setWidthPt(toPoints(Math.max(0.1, v), unit))}
          />
          <NumberField
            label="Height"
            suffix={unit}
            value={roundForUnit(fromPoints(heightPt, unit), unit)}
            step={step}
            min={0.1}
            onChange={(v) => setHeightPt(toPoints(Math.max(0.1, v), unit))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SegmentedControl
            label="Orientation"
            value={orientation}
            options={[
              { value: "portrait", label: "Portrait" },
              { value: "landscape", label: "Landscape" },
            ]}
            onChange={setOrientation}
          />
          <SegmentedControl label="Unit" value={unit} options={UNITS} onChange={setUnit} />
        </div>

        {mismatch ? (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-xs leading-relaxed text-amber-900">
              The uploaded image&apos;s proportions don&apos;t match this page. The page size stays as
              set — choose how the reference image is shown.
            </p>
            <SegmentedControl
              value={fitMode}
              options={[
                { value: "contain", label: "Fit (letterbox)" },
                { value: "stretch", label: "Stretch to fill" },
              ]}
              onChange={setFitMode}
            />
          </div>
        ) : null}

        {/* Lets Enter in a field submit the form. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Dialog>
  );
}

export function PageSizeDialog({ open, ...props }: PageSizeDialogProps) {
  return open ? <PageSizeForm {...props} /> : null;
}
