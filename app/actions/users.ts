"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseFormEntries, userSchema, userUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function createUserAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "users", "create")) {
    throw new Error("Forbidden");
  }

  const values = userSchema.parse(parseFormEntries(formData));
  const existingUser = await prisma.user.findUnique({
    where: {
      username: values.username
    }
  });

  if (existingUser) {
    throw new Error("A user with that username already exists.");
  }

  const passwordHash = await bcrypt.hash(values.password, 12);

  await prisma.user.create({
    data: {
      username: values.username,
      passwordHash,
      role: values.role
    }
  });

  revalidatePath("/users");
}

export async function updateUserAction(id: string, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "users", "update")) {
    throw new Error("Forbidden");
  }

  const values = userUpdateSchema.parse(parseFormEntries(formData));
  const updateData: { username: string; role: "ADMIN" | "OPERATOR"; passwordHash?: string } = {
    username: values.username,
    role: values.role
  };

  if (values.newPassword && values.newPassword.length > 0) {
    updateData.passwordHash = await bcrypt.hash(values.newPassword, 12);
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/users");
}

export async function deleteUserAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "users", "delete")) {
    throw new Error("Forbidden");
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const user = await prisma.user.findUnique({ where: { id } });

  if (user?.role === "ADMIN" && adminCount <= 1) {
    throw new Error("Cannot delete the last admin user.");
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/users");
}