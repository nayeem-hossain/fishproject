"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";
import { calcTotalWeightKg, runMathTests } from "@/lib/math";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user as { id: string; role: string };
}

export async function createInventory(projectId: string, formData: FormData) {
  await requireAuth();

  // Verify math engine before any DB write
  runMathTests();

  const subProject = formData.get("subProject") as string;
  const fishQuantity = parseInt(formData.get("fishQuantity") as string, 10);
  const sizeMon = parseFloat(formData.get("sizeMon") as string);

  if (!subProject || isNaN(fishQuantity) || isNaN(sizeMon)) {
    throw new Error("All fields are required");
  }
  if (fishQuantity < 0) throw new Error("Fish quantity cannot be negative");
  if (sizeMon <= 0) throw new Error("Size must be greater than 0");

  const totalWeightKg = calcTotalWeightKg(fishQuantity, sizeMon);

  await prisma.inventory.create({
    data: { projectId, subProject, fishQuantity, sizeMon, totalWeightKg },
  });

  revalidatePath(`/projects/${projectId}/inventory`);
  return { totalWeightKg };
}

export async function updateInventory(id: string, projectId: string, formData: FormData) {
  await requireAuth();
  runMathTests();

  const subProject = formData.get("subProject") as string;
  const fishQuantity = parseInt(formData.get("fishQuantity") as string, 10);
  const sizeMon = parseFloat(formData.get("sizeMon") as string);

  if (sizeMon <= 0) throw new Error("Size must be greater than 0");
  const totalWeightKg = calcTotalWeightKg(fishQuantity, sizeMon);

  await prisma.inventory.update({
    where: { id },
    data: { subProject, fishQuantity, sizeMon, totalWeightKg },
  });

  revalidatePath(`/projects/${projectId}/inventory`);
  return { totalWeightKg };
}

export async function deleteInventory(id: string, projectId: string) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Admin only");
  await prisma.inventory.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/inventory`);
}

export async function previewWeight(quantity: number, sizeMon: number) {
  "use server";
  if (sizeMon <= 0 || quantity < 0) return null;
  return calcTotalWeightKg(quantity, sizeMon);
}
