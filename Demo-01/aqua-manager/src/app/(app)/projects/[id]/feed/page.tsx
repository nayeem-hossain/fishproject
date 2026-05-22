import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FeedClient } from "./FeedClient";

interface Props { params: Promise<{ id: string }> }

export default async function FeedPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const role = (session.user as { role: string }).role;

  const feedLogs = await prisma.feedLog.findMany({
    where: { projectId: id },
    orderBy: { entryDate: "desc" },
  });

  return <FeedClient projectId={id} feedLogs={feedLogs} role={role} />;
}
