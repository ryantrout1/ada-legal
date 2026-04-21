/**
 * Browser-side photo downscaler.
 *
 * Why this exists: modern phone photos are 3–5 MB raw. Sending them
 * over Vercel's platform edge (even via client-direct-upload to Blob)
 * is slow enough to feel broken — users see 30+ second upload times.
 * Our AI vision model (Haiku) also downscales server-side before it
 * runs, so the extra pixels are literally discarded. We lose nothing
 * by shrinking client-side first.
 *
 * What it does: takes a File, resizes via HTMLCanvasElement to max
 * 1920px longest side, re-encodes as JPEG at 0.75 quality. Typical
 * result: 200–500 KB, visually indistinguishable from the original
 * for ADA documentation purposes (showing a step, ramp, door width,
 * parking sign, etc.).
 *
 * Graceful degradation: if canvas/createObjectURL/image decode fails
 * for any reason (very unlikely in modern browsers), returns the
 * original File untouched. Better to send a too-big photo and let
 * the upload step deal with it than block the user at photo-pick time.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.75;
const OUTPUT_TYPE = 'image/jpeg';

export async function downscalePhoto(file: File): Promise<File> {
  // PNGs with transparency would lose the alpha channel if converted
  // to JPEG. The ADA use case never needs transparency (these are
  // photos of physical barriers) so JPEG is always fine; but we still
  // check that the image is actually an image before processing.
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await loadBitmap(file);

    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);

    // If the source is already smaller than our target, skip the
    // resize — re-encoding a tiny photo just wastes CPU and can
    // actually GROW the file when the JPEG encoder's overhead exceeds
    // the savings on a small image.
    if (width === bitmap.width && height === bitmap.height && file.size < 800 * 1024) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await canvasToBlob(canvas, OUTPUT_TYPE, JPEG_QUALITY);
    if (!blob) return file;

    // Build a new File so downstream code (which reads file.name,
    // file.type, file.size) keeps working. Swap the extension to .jpg
    // since we re-encoded as JPEG.
    const newName = swapExtension(file.name, 'jpg');
    return new File([blob], newName, { type: OUTPUT_TYPE });
  } catch {
    // Silent fallback — the worst-case outcome is upload is slow,
    // not that the user can't attach a photo at all.
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap is supported in all evergreen browsers and
  // auto-applies EXIF rotation on iOS Safari 15+ — which matters
  // because phones frequently store images in landscape orientation
  // with an EXIF flag saying "rotate 90°". Without this the photo
  // would upload sideways.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

function fitWithin(
  srcW: number,
  srcH: number,
  max: number,
): { width: number; height: number } {
  if (srcW <= max && srcH <= max) return { width: srcW, height: srcH };
  const ratio = srcW / srcH;
  if (srcW >= srcH) {
    return { width: max, height: Math.round(max / ratio) };
  }
  return { width: Math.round(max * ratio), height: max };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function swapExtension(name: string, newExt: string): string {
  const idx = name.lastIndexOf('.');
  const base = idx === -1 ? name : name.slice(0, idx);
  return `${base}.${newExt}`;
}
