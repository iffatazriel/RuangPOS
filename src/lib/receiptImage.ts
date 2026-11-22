import { wrapReceiptText } from "./receipt";
import { downloadBlob } from "./download";

export async function receiptPNG(text: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung gambar struk. Gunakan cetak atau Kirim WA.");
  const width = 720, padding = 36, lineHeight = 32;
  context.font = "22px monospace";
  const lines = wrapReceiptText(text, value => context.measureText(value).width, width - padding * 2);
  const height = padding * 2 + lines.length * lineHeight;
  if (height > 30000) throw new Error("Struk terlalu panjang untuk gambar. Gunakan cetak atau Kirim WA.");
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#111";
  context.textBaseline = "top";
  lines.forEach((line, i) => {
    context.font = i === 0 ? "bold 22px monospace" : "22px monospace";
    context.fillText(line, padding, padding + i * lineHeight);
  });
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Gambar struk gagal dibuat.")), "image/png"));
}
export async function shareReceiptPNG(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Struk RuangPOS" });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}
