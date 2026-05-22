import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/InventoryClient";

export const dynamic = "force-dynamic";

export default async function ProjectInventoryPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const inventoryRows = await prisma.inventory.findMany({
    where: { projectId: id },
    orderBy: { id: "desc" }
  });

  const inventories = inventoryRows.map((row) => ({
    id: row.id,
    subProject: row.subProject,
    fishQuantity: row.fishQuantity,
    sizeMon: Number(row.sizeMon),
    totalWeightKg: Number(row.totalWeightKg)
  }));

  return <InventoryClient projectId={id} inventories={inventories} role={session.user.role} />;
}