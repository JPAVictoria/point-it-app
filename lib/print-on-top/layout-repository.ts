import "server-only";
import { getPrisma } from "@/lib/db";
import { Layout as LayoutRecord, Prisma } from "@/lib/generated/prisma/client";
import { BACKGROUND_BUCKET, getSupabase } from "@/lib/supabase/server";
import { createDefaultPageSize } from "./factory";
import { BackgroundImage, LayoutConfig, LayoutContent, LayoutSummary, PageSize, TextField } from "./types";

/**
 * All data access for layouts: the `layouts` table through Prisma, reference
 * images through Supabase Storage. Server-only. Callers (Server Functions /
 * Server Components) validate input with `layout-validation.ts` first.
 */

/** Signed image links live long enough for an editing session; the browser caches the image after first load. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const COMPILATION_PAGE_SIZE = 24;
export const DEFAULT_LAYOUT_NAME = "Untitled Layout";

export type CompilationSort = "updated" | "name" | "created";

export type SaveResult =
  | { status: "saved"; version: number; updatedAt: string }
  | { status: "conflict" }
  | { status: "not_found" };

/** Only rows that haven't been soft-deleted. */
const ACTIVE = { deletedAt: null } as const;

// The JSON columns hold the shapes from types.ts; they're validated on the way in.
function toLayout(row: LayoutRecord): LayoutConfig {
  return {
    id: row.id,
    name: row.name,
    authorName: row.authorName,
    page: row.page as unknown as PageSize,
    fields: row.fields as unknown as TextField[],
    background: row.background as unknown as BackgroundImage | null,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toJson(value: object): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** A nullable JSON column needs Prisma's DbNull marker to store SQL NULL. */
function backgroundJson(background: BackgroundImage | null) {
  return background ? toJson(background) : Prisma.DbNull;
}

function bucket() {
  return getSupabase().storage.from(BACKGROUND_BUCKET);
}

function checkStorage<T>(result: { data: T; error: { message: string } | null }, action: string): T {
  if (result.error) throw new Error(`Could not ${action}: ${result.error.message}`);
  return result.data;
}

async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const data = checkStorage(await bucket().createSignedUrls(paths, SIGNED_URL_TTL_SECONDS), "sign image links");
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
  }
  return urls;
}

export async function listLayouts(options: {
  query: string;
  sort: CompilationSort;
  page: number;
}): Promise<{ items: LayoutSummary[]; total: number }> {
  const prisma = getPrisma();
  const where: Prisma.LayoutWhereInput = {
    ...ACTIVE,
    ...(options.query ? { name: { contains: options.query, mode: "insensitive" } } : {}),
  };
  const orderBy: Prisma.LayoutOrderByWithRelationInput =
    options.sort === "name" ? { name: "asc" } : options.sort === "created" ? { createdAt: "desc" } : { updatedAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.layout.findMany({
      where,
      orderBy,
      skip: (options.page - 1) * COMPILATION_PAGE_SIZE,
      take: COMPILATION_PAGE_SIZE,
    }),
    prisma.layout.count({ where }),
  ]);

  const layouts = rows.map((row) => ({ row, layout: toLayout(row) }));
  const thumbs = await signedUrls(
    layouts.flatMap(({ layout }) => (layout.background ? [layout.background.thumbnailPath] : []))
  );

  return {
    total,
    items: layouts.map(({ row, layout }) => ({
      ...layout,
      createdAt: row.createdAt.toISOString(),
      thumbnailUrl: layout.background ? thumbs.get(layout.background.thumbnailPath) ?? null : null,
    })),
  };
}

/** Returns the layout and a signed URL for its image, or null if it doesn't exist or was deleted. */
export async function getLayout(id: string): Promise<{ layout: LayoutConfig; imageUrl: string | null } | null> {
  const row = await getPrisma().layout.findFirst({ where: { id, ...ACTIVE } });
  if (!row) return null;

  const layout = toLayout(row);
  const imageUrl = layout.background
    ? (await signedUrls([layout.background.storagePath])).get(layout.background.storagePath) ?? null
    : null;
  return { layout, imageUrl };
}

export async function createLayout(authorName: string | null): Promise<string> {
  const row = await getPrisma().layout.create({
    data: { name: DEFAULT_LAYOUT_NAME, authorName, page: toJson(createDefaultPageSize()), fields: [] },
    select: { id: true },
  });
  return row.id;
}

/**
 * Copies a layout (and its image files, so the copy owns them) into a new
 * layout credited to `authorName`. Returns the new id, or null if the source
 * doesn't exist.
 */
export async function duplicateLayout(id: string, authorName: string | null): Promise<string | null> {
  const source = await getLayout(id);
  if (!source) return null;
  const { layout } = source;
  const newId = crypto.randomUUID();

  let background: BackgroundImage | null = null;
  if (layout.background) {
    const fileId = crypto.randomUUID();
    const ext = layout.background.storagePath.endsWith(".png") ? "png" : "jpg";
    const storagePath = `${newId}/${fileId}.${ext}`;
    const thumbnailPath = `${newId}/${fileId}.thumb.jpg`;
    checkStorage(await bucket().copy(layout.background.storagePath, storagePath), "copy the image");
    checkStorage(await bucket().copy(layout.background.thumbnailPath, thumbnailPath), "copy the thumbnail");
    background = { ...layout.background, storagePath, thumbnailPath };
  }

  await getPrisma().layout.create({
    data: {
      id: newId,
      name: `${layout.name} (copy)`.slice(0, 80),
      authorName,
      page: toJson(layout.page),
      fields: toJson(layout.fields),
      background: backgroundJson(background),
    },
  });
  return newId;
}

/**
 * Saves `content` only if the stored version still equals `expectedVersion`
 * (optimistic concurrency). A mismatch means someone saved this layout from
 * another tab or device since it was loaded.
 */
export async function saveLayout(id: string, expectedVersion: number, content: LayoutContent): Promise<SaveResult> {
  const updatedAt = new Date();
  const { count } = await getPrisma().layout.updateMany({
    where: { id, version: expectedVersion, ...ACTIVE },
    data: {
      name: content.name,
      page: toJson(content.page),
      fields: toJson(content.fields),
      background: backgroundJson(content.background),
      version: expectedVersion + 1,
      updatedAt,
    },
  });

  if (count === 1) return { status: "saved", version: expectedVersion + 1, updatedAt: updatedAt.toISOString() };
  return (await getCurrentVersion(id)) === null ? { status: "not_found" } : { status: "conflict" };
}

export async function getCurrentVersion(id: string): Promise<number | null> {
  const row = await getPrisma().layout.findFirst({ where: { id, ...ACTIVE }, select: { version: true } });
  return row?.version ?? null;
}

/** Soft delete: the row and its images stay and can be restored by clearing `deleted_at`. */
export async function softDeleteLayout(id: string): Promise<void> {
  await getPrisma().layout.updateMany({ where: { id, ...ACTIVE }, data: { deletedAt: new Date() } });
}

export interface UploadTarget {
  path: string;
  signedUrl: string;
}

/**
 * Issues signed URLs the browser uploads the image and its thumbnail to
 * directly (Vercel Functions cap request bodies at 4.5 MB, so the file can't
 * pass through our server). The bucket itself enforces the 5 MB and
 * PNG/JPEG limits. Returns null if the layout doesn't exist.
 */
export async function createImageUploadTargets(
  layoutId: string,
  ext: "png" | "jpg"
): Promise<{ image: UploadTarget; thumbnail: UploadTarget } | null> {
  if ((await getCurrentVersion(layoutId)) === null) return null;
  const fileId = crypto.randomUUID();
  const imagePath = `${layoutId}/${fileId}.${ext}`;
  const thumbnailPath = `${layoutId}/${fileId}.thumb.jpg`;

  const image = checkStorage(await bucket().createSignedUploadUrl(imagePath), "prepare the image upload");
  const thumbnail = checkStorage(await bucket().createSignedUploadUrl(thumbnailPath), "prepare the thumbnail upload");
  if (!image || !thumbnail) throw new Error("Could not prepare the upload: Supabase returned no URL.");
  return {
    image: { path: imagePath, signedUrl: image.signedUrl },
    thumbnail: { path: thumbnailPath, signedUrl: thumbnail.signedUrl },
  };
}
