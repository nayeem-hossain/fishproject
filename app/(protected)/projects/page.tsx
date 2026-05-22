import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProjectsClient } from "@/components/ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: {
      projectName: "asc"
    }
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Projects</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Parent project registry</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Each parent project can wrap multiple pond or sub-project records under its detail route.
            </p>
          </div>
          <Link href="/dashboard" className="button-secondary w-fit">
            Back to dashboard
          </Link>
        </div>
      </section>

      <ProjectsClient projects={projects} role={session.user.role} />
    </div>
  );
}