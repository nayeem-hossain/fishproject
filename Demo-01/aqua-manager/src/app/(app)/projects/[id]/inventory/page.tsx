import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InventoryClient } from "./InventoryClient";

interface Props { params: Promise<{ id: string }> }

export default async function InventoryPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const role = (session.user as { role: string }).role;

  const inventories = await prisma.inventory.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  return <InventoryClient projectId={id} inventories={inventories} role={role} />;
}
