import { put } from "@vercel/blob";

type AllowedMime =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

const ALLOWED_TYPES: AllowedMime[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadFile(
  file: File,
  folder: string
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type as AllowedMime)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }

  const filename = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}
