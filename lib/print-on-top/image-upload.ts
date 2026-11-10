/** Browser-only helpers for uploading a reference image to Supabase Storage via signed URLs. */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const THUMBNAIL_WIDTH_PX = 600;
const THUMBNAIL_QUALITY = 0.8;

export interface LoadedImage {
  objectUrl: string;
  naturalWidthPx: number;
  naturalHeightPx: number;
  element: HTMLImageElement;
}

/** Checks type and size before anything is uploaded. Returns an error message, or null if the file is fine. */
export function checkImageFile(file: File): string | null {
  if (file.type !== "image/png" && file.type !== "image/jpeg") return "Only PNG and JPEG images can be uploaded.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB — try exporting the scan at a lower resolution.`;
  }
  return null;
}

/** Decodes the file locally so the editor can show it immediately, before the upload finishes. */
export function loadImage(file: File): Promise<LoadedImage> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () =>
      resolve({ objectUrl, naturalWidthPx: element.naturalWidth, naturalHeightPx: element.naturalHeight, element });
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a readable image."));
    };
    element.src = objectUrl;
  });
}

/** Small JPEG copy for the Compilation page, so browsing doesn't download full scans. */
export function makeThumbnail(image: LoadedImage): Promise<Blob> {
  const scale = Math.min(1, THUMBNAIL_WIDTH_PX / image.naturalWidthPx);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidthPx * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeightPx * scale));
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Could not create a thumbnail in this browser."));
  // JPEG has no transparency; fill white so transparent PNG areas don't turn black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image.element, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create a thumbnail in this browser."))),
      "image/jpeg",
      THUMBNAIL_QUALITY
    )
  );
}

/**
 * PUTs a file to a Supabase signed upload URL (the token in the URL
 * authorizes it, so no API key is needed in the browser). Uses XHR because
 * fetch can't report upload progress.
 */
export function uploadToSignedUrl(
  signedUrl: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(xhr.status === 413 ? "The image is larger than 5 MB." : `Upload failed (${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."));
    xhr.send(body);
  });
}
