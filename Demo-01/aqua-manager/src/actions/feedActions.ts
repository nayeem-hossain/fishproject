"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";
import { calcClosingBalance } from "@/lib/math";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string };
}

export async function createFeedLog(projectId: string, formData: FormData) {
  await requireAuth();

  const entryDate = new Date(formData.get("entryDate") as string);
  const openingBalance = parseFloat(formData.get("openingBalance") as string);
  const additionAmount = parseFloat(formData.get("additionAmount") as string);
  const dailyUse = parseFloat(formData.get("dailyUse") as string);

  if (isNaN(entryDate.getTime())) throw new Error("Invalid date");
  if ([openingBalance, additionAmount, dailyUse].some(isNaN)) {
    throw new Error("All numeric fields are required");
  }
  if (dailyUse < 0 || additionAmount < 0 || openingBalance < 0) {
    throw new Error("Values cannot be negative");
  }

  const closingBalance = calcClosingBalance(openingBalance, additionAmount, dailyUse);

  await prisma.feedLog.create({
    data: { projectId, entryDate, openingBalance, additionAmount, dailyUse, closingBalance },
  });

  revalidatePath(`/projects/${projectId}/feed`);
}

export async function updateFeedLog(id: string, projectId: string, formData: FormData) {
  await requireAuth();

  const entryDate = new Date(formData.get("entryDate") as string);
  const openingBalance = parseFloat(formData.get("openingBalance") as string);
  const additionAmount = parseFloat(formData.get("additionAmount") as string);
  const dailyUse = parseFloat(formData.get("dailyUse") as string);
  const closingBalance = calcClosingBalance(openingBalance, additionAmount, dailyUse);

  await prisma.feedLog.update({
    where: { id },
    data: { entryDate, openingBalance, additionAmount, dailyUse, closingBalance },
  });

  revalidatePath(`/projects/${projectId}/feed`);
}

export async function deleteFeedLog(id: string, projectId: string) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Admin only");
  await prisma.feedLog.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/feed`);
}
