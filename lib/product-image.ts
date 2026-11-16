import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { CommerceError } from "@/lib/commerce-error";

export const maxProductImageBytes = 3 * 1024 * 1024;
const imageFormats = ["jpeg", "png", "webp"];

export async function readProductImage(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  if (typeof value === "string") throw new CommerceError("이미지 파일을 선택해 주세요.");
  if (!value.size && !value.name) return null;
  if (value.size > maxProductImageBytes) throw new CommerceError("이미지는 3MB 이하로 올려 주세요.");

  try {
    const source = sharp(Buffer.from(await value.arrayBuffer()), { limitInputPixels: 24_000_000, failOn: "warning" });
    const metadata = await source.metadata();
    if (!imageFormats.includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) {
      throw new CommerceError("움직이지 않는 JPG, PNG, WebP 이미지를 올려 주세요.");
    }
    const imageBytes = await source.rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 }).toBuffer();
    return { imageBytes, imageVersion: randomUUID() };
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError("이미지를 읽을 수 없습니다. JPG, PNG, WebP 형식과 이미지 크기를 확인해 주세요.");
  }
}
