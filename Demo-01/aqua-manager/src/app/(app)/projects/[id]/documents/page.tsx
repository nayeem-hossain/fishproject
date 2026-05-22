import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocumentsClient } from "./DocumentsClient";

interface Props { params: Promise<{ id: string }> }

export default async function DocumentsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const role = (session.user as { role: string }).role;

  const documents = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  return <DocumentsClient projectId={id} documents={documents} role={role} />;
}
