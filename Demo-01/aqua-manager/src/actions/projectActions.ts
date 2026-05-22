"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string; name?: string };
}

function requireAdmin(role: string) {
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");
}

export async function createProject(formData: FormData) {
  const user = await requireAuth();
  requireAdmin(user.role);

  const projectName = formData.get("projectName") as string;
  const ownerName = formData.get("ownerName") as string;
  const mobileNo = formData.get("mobileNo") as string;

  if (!projectName || !ownerName || !mobileNo) throw new Error("All fields required");

  await prisma.project.create({ data: { projectName, ownerName, mobileNo } });
  revalidatePath("/projects");
}

export async function updateProject(id: string, formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "OPERATOR") throw new Error("Forbidden");

  const projectName = formData.get("projectName") as string;
  const ownerName = formData.get("ownerName") as string;
  const mobileNo = formData.get("mobileNo") as string;

  await prisma.project.update({ where: { id }, data: { projectName, ownerName, mobileNo } });
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  const user = await requireAuth();
  requireAdmin(user.role);
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
}

export async function getProjects() {
  await requireAuth();
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getProject(id: string) {
  await requireAuth();
  return prisma.project.findUniqueOrThrow({ where: { id } });
}
