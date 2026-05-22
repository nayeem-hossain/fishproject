import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "OPERATOR"]);

export const projectSchema = z.object({
  projectName: z.string().trim().min(2, "Project name is required."),
  ownerName: z.string().trim().min(2, "Owner name is required."),
  mobileNo: z.string().trim().min(7, "Mobile number is required.").max(20, "Mobile number is too long.")
});

export const userSchema = z.object({
  username: z.string().trim().min(3, "Username is required.").max(50, "Username is too long."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: roleSchema,
  projectId: z.string().trim().optional().or(z.literal("")).transform(v => v || null),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3, "Username is required.").max(50, "Username is too long."),
  role: roleSchema,
  newPassword: z.string().trim().min(6, "Password must be at least 6 characters.").optional().or(z.literal("")),
  projectId: z.string().trim().optional().or(z.literal("")).transform(v => v || null),
});

export const documentSchema = z.object({
  subProject: z.string().trim().min(1, "Sub project is required."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive whole number."),
  chequeNumber: z.string().trim().min(1, "Cheque number is required."),
  guarantorName: z.string().trim().min(1, "Guarantor name is required.")
});

export const inventorySchema = z.object({
  subProject: z.string().trim().min(1, "Sub project is required."),
  fishQuantity: z.coerce.number().int().positive("Fish quantity must be greater than zero."),
  sizeMon: z.coerce.number().positive("Size must be greater than zero.")
});

export const feedLogSchema = z.object({
  entryDate: z.coerce.date(),
  openingBalance: z.coerce.number(),
  additionAmount: z.coerce.number(),
  dailyUse: z.coerce.number()
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required.")
});

export function parseFormEntries(formData: FormData) {
  return Object.fromEntries(formData.entries());
}