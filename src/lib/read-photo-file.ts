const MAX_EDGE = 1600;
const MAX_CHARS = 2_400_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

export async function readPhotoFile(
  file: File,
  options?: { keepTransparency?: boolean },
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a photo file.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read photo");
    ctx.drawImage(bitmap, 0, 0, width, height);

    if (options?.keepTransparency && file.type.includes("png")) {
      const png = canvas.toDataURL("image/png");
      if (png.length <= MAX_CHARS) return png;
    }

    let quality = 0.84;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > MAX_CHARS && quality > 0.45) {
      quality -= 0.08;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    if (data.length > MAX_CHARS) {
      throw new Error("That photo is still too large. Try another shot.");
    }
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("That photo")) throw err;
    const fallback = await readAsDataUrl(file);
    if (fallback.length > MAX_CHARS) {
      throw new Error("That photo is too large. Try a smaller file.");
    }
    return fallback;
  }
}
