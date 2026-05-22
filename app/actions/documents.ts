"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { documentSchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProjectDocumentFile } from "@/lib/blob";

function requireFile(formData: FormData, fieldName: string) {
  const file = formData.get(fieldName);

  if (!(file instanceof File) || file.size <= 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return file;
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
  const [deedFile, guarantorChequeFile, nidFile, tradeLicenseFile] = [
    requireFile(formData, "deedFile"),
    requireFile(formData, "guarantorChequeFile"),
    requireFile(formData, "nidFile"),
    requireFile(formData, "tradeLicenseFile")
  ];

  const [deedFileUrl, guarantorChequeFileUrl, nidFileUrl, tradeLicenseFileUrl] = await Promise.all([
    uploadProjectDocumentFile({ projectId, subProject: values.subProject, label: "deed", file: deedFile }),
    uploadProjectDocumentFile({
      projectId,
      subProject: values.subProject,
      label: "guarantor-cheque",
      file: guarantorChequeFile
    }),
    uploadProjectDocumentFile({ projectId, subProject: values.subProject, label: "nid", file: nidFile }),
    uploadProjectDocumentFile({
      projectId,
      subProject: values.subProject,
      label: "trade-license",
      file: tradeLicenseFile
    })
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