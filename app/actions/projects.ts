"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseFormEntries, projectSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProjectAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "projects", "create")) {
    throw new Error("Forbidden");
  }

  const values = projectSchema.parse(parseFormEntries(formData));

  await prisma.project.create({
    data: values
  });

  revalidatePath("/projects");
}

export async function updateProjectAction(id: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "projects", "update")) {
    throw new Error("Forbidden");
  }

  const values = projectSchema.parse(parseFormEntries(formData));

  await prisma.project.update({
    where: { id },
    data: values
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProjectAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "projects", "delete")) {
    throw new Error("Forbidden");
  }

  await prisma.project.delete({ where: { id } });

  revalidatePath("/projects");
}