import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { FeedClient } from "@/components/FeedClient";

export const dynamic = "force-dynamic";

export default async function ProjectFeedPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const feedRows = await prisma.feedLog.findMany({
    where: { projectId: id },
    orderBy: { entryDate: "desc" }
  });

  const feedLogs = feedRows.map((row) => ({
    id: row.id,
    entryDate: row.entryDate.toISOString(),
    openingBalance: Number(row.openingBalance),
    additionAmount: Number(row.additionAmount),
    dailyUse: Number(row.dailyUse),
    closingBalance: Number(row.closingBalance)
  }));

  return <FeedClient projectId={id} feedLogs={feedLogs} role={session.user.role} />;
}