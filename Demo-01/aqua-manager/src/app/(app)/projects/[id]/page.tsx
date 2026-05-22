import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function ProjectOverviewPage({ params }: Props) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      inventories: true,
      feedLogs: { orderBy: { entryDate: "desc" }, take: 1 },
      documents: { select: { id: true } },
    },
  });
  if (!project) notFound();

  const totalFish = project.inventories.reduce((s, i) => s + i.fishQuantity, 0);
  const totalWeight = project.inventories.reduce((s, i) => s + i.totalWeightKg, 0);
  const latestFeed = project.feedLogs[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Documents", value: project.documents.length, unit: "files" },
        { label: "Sub-projects", value: project.inventories.length, unit: "ponds" },
        { label: "Total Fish", value: totalFish.toLocaleString(), unit: "pcs" },
        { label: "Total Weight", value: totalWeight.toLocaleString(), unit: "kg" },
      ].map((stat) => (
        <div key={stat.label} className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
          <p className="text-xs text-gray-400 mt-1">{stat.unit}</p>
          <p className="text-sm font-medium text-gray-600 mt-1">{stat.label}</p>
        </div>
      ))}

      {latestFeed && (
        <div className="card col-span-2 lg:col-span-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Latest Feed Entry</p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <span>Date: <strong>{new Date(latestFeed.entryDate).toLocaleDateString()}</strong></span>
            <span>Opening: <strong>{latestFeed.openingBalance} kg</strong></span>
            <span>Added: <strong>{latestFeed.additionAmount} kg</strong></span>
            <span>Used: <strong>{latestFeed.dailyUse} kg</strong></span>
            <span>Closing: <strong>{latestFeed.closingBalance} kg</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
