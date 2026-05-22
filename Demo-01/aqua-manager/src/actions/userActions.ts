"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== "ADMIN") throw new Error("Admin access required");
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "OPERATOR";

  if (!username || !password || !["ADMIN", "OPERATOR"].includes(role)) {
    throw new Error("All fields are required");
  }
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) throw new Error("Username already taken");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { username, passwordHash, role } });
  revalidatePath("/users");
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();

  const username = formData.get("username") as string;
  const role = formData.get("role") as "ADMIN" | "OPERATOR";
  const newPassword = formData.get("newPassword") as string;

  const updateData: { username: string; role: "ADMIN" | "OPERATOR"; passwordHash?: string } = { username, role };

  if (newPassword && newPassword.length > 0) {
    if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({ where: { id }, data: updateData });
  revalidatePath("/users");
}

export async function deleteUser(id: string) {
  await requireAdmin();
  // Prevent deleting the last admin
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "ADMIN" && adminCount <= 1) {
    throw new Error("Cannot delete the last admin user");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}
