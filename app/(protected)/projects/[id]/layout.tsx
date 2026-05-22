import { auth } from "@/auth";
import { ProjectSubnav } from "@/components/project-subnav";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  // If the user is scoped to a specific project, block access to any other project
  if (session.user.projectId && session.user.projectId !== id) {
    redirect("/projects");
  }

  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Project detail</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{project.projectName}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Owner: {project.ownerName} · Mobile: {project.mobileNo}
            </p>
          </div>
          <ProjectSubnav projectId={project.id} />
        </div>
      </section>

      {children}
    </div>
  );
}