export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.1;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Computes the zoom level that fits a page of pageWidthPt x pageHeightPt into the given container, with a small margin. */
export function computeFitZoom(
  containerWidthPx: number,
  containerHeightPx: number,
  pageWidthPt: number,
  pageHeightPt: number
): number {
  if (containerWidthPx <= 0 || containerHeightPx <= 0 || pageWidthPt <= 0 || pageHeightPt <= 0) {
    return 1;
  }
  const margin = 0.92;
  const scaleX = (containerWidthPx * margin) / pageWidthPt;
  const scaleY = (containerHeightPx * margin) / pageHeightPt;
  return clampZoom(Math.min(scaleX, scaleY));
}
