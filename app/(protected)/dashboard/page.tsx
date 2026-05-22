import { auth } from "@/auth";
import { getDashboardMetrics } from "@/lib/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

function MetricCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <article className="surface p-6">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const metrics = await getDashboardMetrics(session?.user.projectId);
  const isAdmin = session?.user.role === "ADMIN" && !session?.user.projectId;

  const cards = isAdmin
    ? [
        { title: "Total projects", value: metrics.projectCount.toString(), helper: "Parent projects registered in the system." },
        { title: "Total inventory weight (kg)", value: metrics.totalInventoryWeightKg, helper: "Summed across all inventory rows." },
        { title: "Total feed closing balance", value: metrics.totalFeedClosingBalance, helper: "Summed across feed logs." }
      ]
    : [
        { title: "Restricted projects view", value: metrics.projectCount.toString(), helper: "Operator snapshot of the current project set." },
        { title: "Restricted inventory view (kg)", value: metrics.totalInventoryWeightKg, helper: "Operational inventory weight snapshot." },
        { title: "Restricted feed view", value: metrics.totalFeedClosingBalance, helper: "Operational feed snapshot." }
      ];

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Dashboard</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">System overview</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Role-aware metrics and navigation for project, inventory, document, and feed operations.
            </p>
          </div>
          <div className="surface-soft px-4 py-3 text-sm text-slate-300">
            Signed in as <span className="font-semibold text-white">{session?.user.name}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="surface p-6">
        <h2 className="text-lg font-semibold text-white">Quick links</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>→ <Link href="/projects" className="text-sky-300 hover:underline">Browse projects</Link> to manage documents, inventory, and feed logs.</li>
          {isAdmin && <li>→ <Link href="/users" className="text-sky-300 hover:underline">Manage users</Link> to create or assign project-scoped accounts.</li>}
        </ul>
      </section>
    </div>
  );
}