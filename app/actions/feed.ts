"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateFeedClosingBalance, ensureFiniteDecimal } from "@/lib/math";
import { can } from "@/lib/rbac";
import { feedLogSchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export async function createFeedLogAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "feed", "create")) {
    throw new Error("Forbidden");
  }

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    throw new Error("projectId is required.");
  }

  const values = feedLogSchema.parse(parseFormEntries(formData));
  const closingBalance = ensureFiniteDecimal(
    calculateFeedClosingBalance(values.openingBalance, values.additionAmount, values.dailyUse)
  );

  await prisma.feedLog.create({
    data: {
      projectId,
      entryDate: values.entryDate,
      openingBalance: new Prisma.Decimal(values.openingBalance.toString()),
      additionAmount: new Prisma.Decimal(values.additionAmount.toString()),
      dailyUse: new Prisma.Decimal(values.dailyUse.toString()),
      closingBalance: new Prisma.Decimal(closingBalance.toString())
    }
  });

  revalidatePath(`/projects/${projectId}/feed`);
}

export async function updateFeedLogAction(id: string, projectId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "feed", "update")) {
    throw new Error("Forbidden");
  }

  const values = feedLogSchema.parse(parseFormEntries(formData));

  if (values.openingBalance < 0 || values.additionAmount < 0 || values.dailyUse < 0) {
    throw new Error("Values cannot be negative.");
  }

  const closingBalance = ensureFiniteDecimal(
    calculateFeedClosingBalance(values.openingBalance, values.additionAmount, values.dailyUse)
  );

  await prisma.feedLog.update({
    where: { id },
    data: {
      entryDate: values.entryDate,
      openingBalance: new Prisma.Decimal(values.openingBalance.toString()),
      additionAmount: new Prisma.Decimal(values.additionAmount.toString()),
      dailyUse: new Prisma.Decimal(values.dailyUse.toString()),
      closingBalance: new Prisma.Decimal(closingBalance.toString())
    }
  });

  revalidatePath(`/projects/${projectId}/feed`);
}

export async function deleteFeedLogAction(id: string, projectId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "feed", "delete")) {
    throw new Error("Forbidden");
  }

  await prisma.feedLog.delete({ where: { id } });

  revalidatePath(`/projects/${projectId}/feed`);
}