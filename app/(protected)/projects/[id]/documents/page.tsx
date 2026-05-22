import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DocumentsClient } from "@/components/DocumentsClient";

export const dynamic = "force-dynamic";

export default async function ProjectDocumentsPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const documents = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { id: "desc" }
  });

  return <DocumentsClient projectId={id} documents={documents} role={session.user.role} />;
}