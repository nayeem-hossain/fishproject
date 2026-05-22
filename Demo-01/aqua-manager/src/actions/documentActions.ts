"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";
import { uploadFile } from "@/lib/blob";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string };
}

export async function createDocument(projectId: string, formData: FormData) {
  const user = await requireAuth();

  const subProject = formData.get("subProject") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const chequeNumber = formData.get("chequeNumber") as string;
  const guarantorName = formData.get("guarantorName") as string;

  if (!subProject || isNaN(quantity) || !chequeNumber || !guarantorName) {
    throw new Error("All fields are required");
  }

  async function maybeUpload(field: string, folder: string) {
    const file = formData.get(field) as File | null;
    if (!file || file.size === 0) return undefined;
    return uploadFile(file, folder);
  }

  const [deedFileUrl, guarantorChequeFileUrl, nidFileUrl, tradeLicenseFileUrl] = await Promise.all([
    maybeUpload("deedFile", `documents/${projectId}/deed`),
    maybeUpload("guarantorChequeFile", `documents/${projectId}/guarantor-cheque`),
    maybeUpload("nidFile", `documents/${projectId}/nid`),
    maybeUpload("tradeLicenseFile", `documents/${projectId}/trade-license`),
  ]);

  await prisma.document.create({
    data: {
      projectId,
      subProject,
      quantity,
      chequeNumber,
      guarantorName,
      deedFileUrl,
      guarantorChequeFileUrl,
      nidFileUrl,
      tradeLicenseFileUrl,
    },
  });

  revalidatePath(`/projects/${projectId}/documents`);
}

export async function updateDocument(id: string, projectId: string, formData: FormData) {
  await requireAuth();

  const subProject = formData.get("subProject") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const chequeNumber = formData.get("chequeNumber") as string;
  const guarantorName = formData.get("guarantorName") as string;

  await prisma.document.update({
    where: { id },
    data: { subProject, quantity, chequeNumber, guarantorName },
  });

  revalidatePath(`/projects/${projectId}/documents`);
}

export async function deleteDocument(id: string, projectId: string) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Admin only");
  await prisma.document.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/documents`);
}
