import { put } from "@vercel/blob";

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function uploadProjectDocumentFile(params: {
  projectId: string;
  subProject: string;
  label: string;
  file: File;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for document uploads.");
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(params.file.type)) {
    throw new Error(`Unsupported file type: ${params.file.type || "unknown"}`);
  }

  if (params.file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (params.file.size > MAX_SIZE_BYTES) {
    throw new Error("Uploaded file exceeds 10 MB.");
  }

  const safeName = sanitizeFileName(params.file.name || `${params.label}.bin`);
  const blobPath = [
    "projects",
    params.projectId,
    params.subProject,
    `${params.label}-${Date.now()}-${safeName}`
  ].join("/");

  const result = await put(blobPath, params.file, {
    access: "public"
  });

  return result.url;
}

export async function uploadFile(file: File, folder: string) {
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  if (file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Uploaded file exceeds 10 MB.");
  }

  const safeName = sanitizeFileName(file.name || "upload.bin");
  const blobPath = `${folder}/${Date.now()}-${safeName}`;

  const result = await put(blobPath, file, { access: "public" });
  return result.url;
}