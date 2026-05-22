import { prisma } from "@/lib/db";

export async function getDashboardMetrics(projectId?: string | null) {
  const scopeFilter = projectId ? { projectId } : {};

  try {
    const [projectCount, inventorySum, feedSum] = await Promise.all([
      projectId
        ? prisma.project.count({ where: { id: projectId } })
        : prisma.project.count(),
      prisma.inventory.aggregate({
        where: scopeFilter,
        _sum: { totalWeightKg: true },
      }),
      prisma.feedLog.aggregate({
        where: scopeFilter,
        _sum: { closingBalance: true },
      }),
    ]);

    return {
      projectCount,
      totalInventoryWeightKg: inventorySum._sum.totalWeightKg?.toString() ?? "0",
      totalFeedClosingBalance: feedSum._sum.closingBalance?.toString() ?? "0",
    };
  } catch (error) {
    console.warn("Dashboard metrics fallback used.", error);
    return {
      projectCount: 0,
      totalInventoryWeightKg: "0",
      totalFeedClosingBalance: "0",
    };
  }
}
