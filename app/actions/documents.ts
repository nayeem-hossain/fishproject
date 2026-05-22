"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { documentSchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProjectDocumentFile } from "@/lib/blob";

type ActionResult = { error: string } | { ok: true };

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
  return uploadProjectDocumentFile({ ...params, file });
}

export async function createDocumentAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "documents", "create")) return { error: "Forbidden" };

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "projectId is required." };

  const parsed = documentSchema.safeParse(parseFormEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const values = parsed.data;

  try {
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
        tradeLicenseFileUrl,
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unexpected error. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/documents`);
  return { ok: true };
}

export async function updateDocumentAction(id: string, projectId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "documents", "update")) return { error: "Forbidden" };

  const parsed = documentSchema.safeParse(parseFormEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await prisma.document.update({
      where: { id },
      data: {
        subProject: parsed.data.subProject,
        quantity: parsed.data.quantity,
        chequeNumber: parsed.data.chequeNumber,
        guarantorName: parsed.data.guarantorName,
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unexpected error. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/documents`);
  return { ok: true };
}

export async function deleteDocumentAction(id: string, projectId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "documents", "delete")) return { error: "Forbidden" };

  try {
    await prisma.document.delete({ where: { id } });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unexpected error." };
  }

  revalidatePath(`/projects/${projectId}/documents`);
  return { ok: true };
}
