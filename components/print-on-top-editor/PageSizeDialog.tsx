import { useState } from "react";
import { BackgroundImage, LengthUnit, PageSize } from "@/lib/print-on-top/types";
import { fromPoints, roundForUnit, toPoints } from "@/lib/print-on-top/units";
import { PAPER_PRESETS } from "@/lib/print-on-top/paper-sizes";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { NumberField } from "./ui/NumberField";
import { SelectField } from "./ui/SelectField";

interface PageSizeDialogProps {
  open: boolean;
  onClose: () => void;
  page: PageSize;
  background: BackgroundImage | null;
  onChangePage: (patch: Partial<PageSize>) => void;
  onChangeBackgroundFitMode: (fitMode: BackgroundImage["fitMode"]) => void;
}

const UNITS: LengthUnit[] = ["in", "cm", "mm", "pt"];

function aspectMismatch(page: PageSize, background: BackgroundImage | null): boolean {
  if (!background) return false;
  const pageRatio = page.widthPt / page.heightPt;
  const imageRatio = background.naturalWidthPx / background.naturalHeightPx;
  return Math.abs(pageRatio - imageRatio) / pageRatio > 0.05;
}

export function PageSizeDialog({
  open,
  onClose,
  page,
  background,
  onChangePage,
  onChangeBackgroundFitMode,
}: PageSizeDialogProps) {
  const [preset, setPreset] = useState("Custom");

  function applyPreset(name: string) {
    setPreset(name);
    const found = PAPER_PRESETS.find((p) => p.name === name);
    if (!found || name === "Custom") return;
    const isLandscape = page.orientation === "landscape";
    onChangePage({
      widthPt: isLandscape ? found.heightPt : found.widthPt,
      heightPt: isLandscape ? found.widthPt : found.heightPt,
    });
  }

  function toggleOrientation() {
    onChangePage({
      widthPt: page.heightPt,
      heightPt: page.widthPt,
      orientation: page.orientation === "portrait" ? "landscape" : "portrait",
    });
  }

  const widthDisplay = roundForUnit(fromPoints(page.widthPt, page.displayUnit), page.displayUnit);
  const heightDisplay = roundForUnit(fromPoints(page.heightPt, page.displayUnit), page.displayUnit);
  const mismatch = aspectMismatch(page, background);

  return (
    <Dialog title="Page size" open={open} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <SelectField
          label="Preset"
          value={preset}
          options={PAPER_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
          onChange={applyPreset}
        />

        <SelectField
          label="Unit"
          value={page.displayUnit}
          options={UNITS.map((u) => ({ value: u, label: u }))}
          onChange={(u) => onChangePage({ displayUnit: u as LengthUnit })}
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label={`Width (${page.displayUnit})`}
            value={widthDisplay}
            step={page.displayUnit === "pt" ? 1 : 0.01}
            min={0.1}
            onChange={(v) => {
              setPreset("Custom");
              onChangePage({ widthPt: toPoints(Math.max(0.1, v), page.displayUnit) });
            }}
          />
          <NumberField
            label={`Height (${page.displayUnit})`}
            value={heightDisplay}
            step={page.displayUnit === "pt" ? 1 : 0.01}
            min={0.1}
            onChange={(v) => {
              setPreset("Custom");
              onChangePage({ heightPt: toPoints(Math.max(0.1, v), page.displayUnit) });
            }}
          />
        </div>

        <Button onClick={toggleOrientation}>
          Switch to {page.orientation === "portrait" ? "landscape" : "portrait"}
        </Button>

        {mismatch ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
            <p className="mb-2">
              The uploaded image&apos;s proportions don&apos;t match this page size. The physical
              page size will not change — choose how the reference image is displayed:
            </p>
            <div className="flex gap-2">
              <Button
                variant={background?.fitMode === "contain" ? "primary" : "secondary"}
                onClick={() => onChangeBackgroundFitMode("contain")}
              >
                Fit (letterbox)
              </Button>
              <Button
                variant={background?.fitMode === "stretch" ? "primary" : "secondary"}
                onClick={() => onChangeBackgroundFitMode("stretch")}
              >
                Stretch to fill
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
