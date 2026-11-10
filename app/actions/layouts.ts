"use server";

import { revalidatePath } from "next/cache";
import {
  createImageUploadTargets,
  createLayout,
  duplicateLayout,
  getCurrentVersion,
  saveLayout,
  SaveResult,
  softDeleteLayout,
  UploadTarget,
} from "@/lib/print-on-top/layout-repository";
import {
  LayoutValidationError,
  parseAuthorName,
  parseLayoutContent,
  parseLayoutId,
} from "@/lib/print-on-top/layout-validation";
import { NotConfiguredError } from "@/lib/server-config";

/**
 * Server Functions for layouts. The app has no logins, so there's no session
 * to check — instead every argument is validated, because these endpoints
 * can be called by anyone with a direct POST.
 *
 * Expected failures come back as `{ ok: false, error }` (production builds
 * hide the message of thrown errors from the browser).
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (err) {
    if (err instanceof LayoutValidationError || err instanceof NotConfiguredError) {
      return { ok: false, error: err.message };
    }
    // Unexpected (network, Supabase outage). Logged server-side; the browser gets a generic message.
    console.error(err);
    return { ok: false, error: "Something went wrong talking to the database. Please try again." };
  }
}

export async function createLayoutAction(authorName: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const id = await createLayout(parseAuthorName(authorName));
    revalidatePath("/compilation");
    return { id };
  });
}

export async function duplicateLayoutAction(
  layoutId: unknown,
  authorName: unknown
): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const id = await duplicateLayout(parseLayoutId(layoutId), parseAuthorName(authorName));
    if (!id) throw new LayoutValidationError("That layout no longer exists.");
    revalidatePath("/compilation");
    return { id };
  });
}

export async function deleteLayoutAction(layoutId: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    await softDeleteLayout(parseLayoutId(layoutId));
    revalidatePath("/compilation");
    return null;
  });
}

/**
 * Autosave. Pass the version the editor last loaded/saved; pass `null` to
 * overwrite whatever is stored (the "Overwrite" choice after a conflict).
 */
export async function saveLayoutAction(
  layoutId: unknown,
  expectedVersion: unknown,
  content: unknown
): Promise<ActionResult<SaveResult>> {
  return run(async () => {
    const id = parseLayoutId(layoutId);
    const parsed = parseLayoutContent(content, id);
    let version: number | null;
    if (expectedVersion === null) {
      version = await getCurrentVersion(id);
      if (version === null) return { status: "not_found" } as const;
    } else if (typeof expectedVersion === "number" && Number.isInteger(expectedVersion) && expectedVersion > 0) {
      version = expectedVersion;
    } else {
      throw new LayoutValidationError("Version is invalid.");
    }
    return saveLayout(id, version, parsed);
  });
}

export async function createImageUploadAction(
  layoutId: unknown,
  contentType: unknown
): Promise<ActionResult<{ image: UploadTarget; thumbnail: UploadTarget }>> {
  return run(async () => {
    const id = parseLayoutId(layoutId);
    if (contentType !== "image/png" && contentType !== "image/jpeg") {
      throw new LayoutValidationError("Only PNG and JPEG images can be uploaded.");
    }
    const targets = await createImageUploadTargets(id, contentType === "image/png" ? "png" : "jpg");
    if (!targets) throw new LayoutValidationError("That layout no longer exists.");
    return targets;
  });
}
