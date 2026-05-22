import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  const [documentCount, inventoryCount, feedCount] = await Promise.all([
    prisma.document.count({ where: { projectId: id } }).catch(() => 0),
    prisma.inventory.count({ where: { projectId: id } }).catch(() => 0),
    prisma.feedLog.count({ where: { projectId: id } }).catch(() => 0)
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[
        { title: "Documents", value: documentCount.toString(), helper: "File uploads and stored URLs." },
        { title: "Inventory rows", value: inventoryCount.toString(), helper: "Sub-project weight tracking." },
        { title: "Feed logs", value: feedCount.toString(), helper: "Daily historical feed entries." }
      ].map((card) => (
        <article key={card.title} className="surface p-6">
          <p className="text-sm font-medium text-slate-400">{card.title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
          <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
        </article>
      ))}
    </div>
  );
}