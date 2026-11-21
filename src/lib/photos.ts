export function photoDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
    reader.readAsDataURL(blob);
  });
}
export function photoBlob(url: string): Blob {
  const [header, content] = url.split(",");
  return new Blob([Uint8Array.from(atob(content), (c) => c.charCodeAt(0))], {
    type: header.slice(5, -7),
  });
}
export async function resizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size > 20_000_000)
    throw new Error("Pilih gambar maksimal 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser tidak mendukung pemrosesan foto.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Foto gagal diproses.")),
        "image/jpeg",
        0.8,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
