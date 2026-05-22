import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ProjectTabNav } from "./ProjectTabNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/projects" className="hover:text-blue-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{project.projectName}</span>
      </div>

      {/* Project header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{project.projectName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Owner: <strong>{project.ownerName}</strong> · {project.mobileNo}
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <ProjectTabNav projectId={id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
