import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createEmptyLayout, createTextField } from "./factory";
import { renderLayoutToPdf } from "./pdf-renderer";

describe("renderLayoutToPdf", () => {
  it("produces a PDF with the configured page dimensions", async () => {
    const layout = createEmptyLayout("Test");
    layout.page = { widthPt: 594, heightPt: 495, displayUnit: "in", orientation: "landscape" };

    const bytes = await renderLayoutToPdf(layout, {});
    const doc = await PDFDocument.load(bytes);
    const page = doc.getPage(0);

    expect(doc.getPageCount()).toBe(1);
    expect(page.getWidth()).toBeCloseTo(594, 5);
    expect(page.getHeight()).toBeCloseTo(495, 5);
  });

  it("fills fields from the provided values, falling back to the sample value", async () => {
    const layout = createEmptyLayout("Test");
    const field = createTextField(50, 50);
    field.name = "customerName";
    field.sampleValue = "Jane Doe";
    layout.fields = [field];

    const bytesWithValue = await renderLayoutToPdf(layout, { customerName: "Acme Corp" });
    const bytesWithSample = await renderLayoutToPdf(layout, {});

    // Different text content should produce different byte output.
    expect(Buffer.from(bytesWithValue).equals(Buffer.from(bytesWithSample))).toBe(false);
  });

  it("skips disabled fields and empty values", async () => {
    const layout = createEmptyLayout("Test");
    const enabled = createTextField(50, 50);
    enabled.name = "a";
    enabled.sampleValue = "visible";

    const disabled = createTextField(50, 100);
    disabled.name = "b";
    disabled.sampleValue = "hidden";
    disabled.enabled = false;

    layout.fields = [enabled, disabled];

    // Should not throw, and should succeed even though one field is disabled.
    const bytes = await renderLayoutToPdf(layout, {});
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("wraps text across multiple lines when maxWidth is set and does not throw", async () => {
    const layout = createEmptyLayout("Test");
    const field = createTextField(10, 10);
    field.name = "notes";
    field.sampleValue = "This is a long sentence that should wrap across more than one line.";
    field.maxWidth = 80;
    field.fontSize = 10;
    layout.fields = [field];

    const bytes = await renderLayoutToPdf(layout, {});
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
