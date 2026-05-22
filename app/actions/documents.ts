"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { documentSchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResult = { error: string } | { ok: true };

export async function createDocumentAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "documents", "create")) return { error: "Forbidden" };

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "projectId is required." };

  const parsed = documentSchema.safeParse(parseFormEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const values = parsed.data;

  // Files are uploaded client-side; action receives the resulting URLs
  const deedFileUrl            = String(formData.get("deedFileUrl")            ?? "");
  const guarantorChequeFileUrl = String(formData.get("guarantorChequeFileUrl") ?? "");
  const nidFileUrl             = String(formData.get("nidFileUrl")             ?? "");
  const tradeLicenseFileUrl    = String(formData.get("tradeLicenseFileUrl")    ?? "");

  try {
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
