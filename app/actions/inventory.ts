"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { calculateInventoryWeightKg, ensureFiniteDecimal, runMathTests } from "@/lib/math";
import { can } from "@/lib/rbac";
import { inventorySchema, parseFormEntries } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export async function createInventoryAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "inventory", "create")) {
    throw new Error("Forbidden");
  }

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    throw new Error("projectId is required.");
  }

  const values = inventorySchema.parse(parseFormEntries(formData));
  runMathTests();
  const totalWeightKg = ensureFiniteDecimal(calculateInventoryWeightKg(values.fishQuantity, values.sizeMon));

  await prisma.inventory.create({
    data: {
      projectId,
      subProject: values.subProject,
      fishQuantity: values.fishQuantity,
      sizeMon: new Prisma.Decimal(values.sizeMon.toString()),
      totalWeightKg: new Prisma.Decimal(totalWeightKg.toString())
    }
  });

  revalidatePath(`/projects/${projectId}/inventory`);
}

export async function updateInventoryAction(id: string, projectId: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "inventory", "update")) {
    throw new Error("Forbidden");
  }

  const values = inventorySchema.parse(parseFormEntries(formData));
  runMathTests();
  const totalWeightKg = ensureFiniteDecimal(calculateInventoryWeightKg(values.fishQuantity, values.sizeMon));

  await prisma.inventory.update({
    where: { id },
    data: {
      subProject: values.subProject,
      fishQuantity: values.fishQuantity,
      sizeMon: new Prisma.Decimal(values.sizeMon.toString()),
      totalWeightKg: new Prisma.Decimal(totalWeightKg.toString())
    }
  });

  revalidatePath(`/projects/${projectId}/inventory`);
}

export async function deleteInventoryAction(id: string, projectId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "inventory", "delete")) {
    throw new Error("Forbidden");
  }

  await prisma.inventory.delete({ where: { id } });

  revalidatePath(`/projects/${projectId}/inventory`);
}