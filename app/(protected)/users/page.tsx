import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { UsersClient } from "@/components/UsersClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "users", "view")) {
    redirect("/dashboard");
  }

  const [users, projects] = await Promise.all([
    prisma.user.findMany({ include: { project: { select: { id: true, projectName: true } } } }).catch(() => []),
    prisma.project.findMany({ orderBy: { projectName: "asc" } }).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">User management</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Administrator accounts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Create and manage operator and administrator accounts. Assign a project to restrict a user to that project only.
        </p>
      </section>

      <UsersClient users={users} projects={projects} />
    </div>
  );
}