/**
 * Normalize an uploaded image to Instagram's portrait carousel spec (1080×1350, 4:5).
 *
 * What gets stored is exactly what appears in the carousel preview AND on Instagram —
 * no surprise cropping at display time.
 *
 * Strategy:
 *   - If the source is already 4:5 (within a small tolerance), pass through untouched.
 *   - Otherwise, draw it to a 1080×1350 canvas using object-fit: cover semantics
 *     (center-crop to fill). This matches how Instagram itself crops non-4:5 uploads.
 *
 * Returned File preserves the original name + lossless PNG when the source was PNG,
 * else 92% JPEG to keep storage footprint down.
 */

const TARGET_W = 1080;
const TARGET_H = 1350;
const TARGET_RATIO = TARGET_W / TARGET_H; // 0.8
const RATIO_TOLERANCE = 0.01; // 1% — anything closer than this we treat as already-4:5

export interface NormalizationResult {
  file: File;
  /** True if we actually re-encoded the image (cropped/resized). */
  modified: boolean;
  /** Original natural dimensions, for telemetry / user warnings. */
  originalWidth: number;
  originalHeight: number;
}

export async function normalizeInstagramImage(file: File): Promise<NormalizationResult> {
  // Only process raster images we can actually decode in a canvas
  if (!file.type.startsWith("image/")) {
    return { file, modified: false, originalWidth: 0, originalHeight: 0 };
  }
  // Skip animated formats / SVG — re-encoding would lose animation or vector quality
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return { file, modified: false, originalWidth: 0, originalHeight: 0 };
  }

  const bitmap = await loadBitmap(file);
  const sw = bitmap.width;
  const sh = bitmap.height;
  const sourceRatio = sw / sh;

  // Already 4:5 (close enough) — pass through untouched
  if (Math.abs(sourceRatio - TARGET_RATIO) < RATIO_TOLERANCE) {
    bitmap.close?.();
    return { file, modified: false, originalWidth: sw, originalHeight: sh };
  }

  // Center-crop to 4:5 then scale to 1080×1350 (object-fit: cover semantics)
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return { file, modified: false, originalWidth: sw, originalHeight: sh };
  }

  // Fill with black like Instagram does for any uncovered area (shouldn't be any
  // with cover semantics, but defensive)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, TARGET_W, TARGET_H);

  // Compute cover crop rect on the source
  let sx = 0;
  let sy = 0;
  let scw = sw;
  let sch = sh;
  if (sourceRatio > TARGET_RATIO) {
    // Source is wider than target — crop sides
    scw = sh * TARGET_RATIO;
    sx = (sw - scw) / 2;
  } else {
    // Source is taller than target — crop top/bottom
    sch = sw / TARGET_RATIO;
    sy = (sh - sch) / 2;
  }
  ctx.drawImage(bitmap, sx, sy, scw, sch, 0, 0, TARGET_W, TARGET_H);
  bitmap.close?.();

  // Preserve PNG if source was PNG (alpha channel matters for design work),
  // otherwise JPEG at 92% quality keeps things compact
  const isPng = file.type === "image/png";
  const outType = isPng ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, outType, isPng ? undefined : 0.92);

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = isPng ? "png" : "jpg";
  const normalizedFile = new File([blob], `${baseName}.${ext}`, {
    type: outType,
    lastModified: Date.now(),
  });

  return {
    file: normalizedFile,
    modified: true,
    originalWidth: sw,
    originalHeight: sh,
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap is faster + handles EXIF orientation correctly when supported
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image" as ImageOrientation,
      });
    } catch {
      // Fall through to <img> path
    }
  }
  return new Promise<ImageBitmap>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const bm = await createImageBitmap(img);
        URL.revokeObjectURL(url);
        resolve(bm);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      type,
      quality
    );
  });
}
