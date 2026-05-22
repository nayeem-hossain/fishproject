"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { documentSchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProjectDocumentFile } from "@/lib/blob";

function getOptionalFile(formData: FormData, fieldName: string): File | null {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size <= 0) return null;
  return file;
}

async function maybeUpload(
  file: File | null,
  params: { projectId: string; subProject: string; label: string }
): Promise<string> {
  if (!file) return "";
  try {
    return await uploadProjectDocumentFile({ ...params, file });
  } catch (e) {
    throw new Error(`File upload failed for ${params.label}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function createDocumentAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "documents", "create")) {
    throw new Error("Forbidden");
  }

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    throw new Error("projectId is required.");
  }

  const values = documentSchema.parse(parseFormEntries(formData));

  const [deedFileUrl, guarantorChequeFileUrl, nidFileUrl, tradeLicenseFileUrl] = await Promise.all([
    maybeUpload(getOptionalFile(formData, "deedFile"),            { projectId, subProject: values.subProject, label: "deed" }),
    maybeUpload(getOptionalFile(formData, "guarantorChequeFile"), { projectId, subProject: values.subProject, label: "guarantor-cheque" }),
    maybeUpload(getOptionalFile(formData, "nidFile"),             { projectId, subProject: values.subProject, label: "nid" }),
    maybeUpload(getOptionalFile(formData, "tradeLicenseFile"),    { projectId, subProject: values.subProject, label: "trade-license" }),
  ]);

  await prisma.document.create({
    data: {
      projectId,
      subProject: values.subProject,
      quantity: values.quantity,
      chequeNumber: values.chequeNumber,
      guarantorName: values.guarantorName,
      deedFileUrl,
      guarantorChequeFileUrl,
      nidFileUrl,
      tradeLicenseFileUrl
    }
  });

  revalidatePath(`/projects/${projectId}/documents`);
}

export async function updateDocumentAction(id: string, projectId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "documents", "update")) {
    throw new Error("Forbidden");
  }

  const values = documentSchema.parse(parseFormEntries(formData));

  await prisma.document.update({
    where: { id },
    data: {
      subProject: values.subProject,
      quantity: values.quantity,
      chequeNumber: values.chequeNumber,
      guarantorName: values.guarantorName
    }
  });

  revalidatePath(`/projects/${projectId}/documents`);
}

export async function deleteDocumentAction(id: string, projectId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "documents", "delete")) {
    throw new Error("Forbidden");
  }

  await prisma.document.delete({ where: { id } });

  revalidatePath(`/projects/${projectId}/documents`);
}