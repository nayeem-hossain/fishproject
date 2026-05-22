import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getAdminMetrics() {
  const [projectCount, inventories, feedLogs] = await Promise.all([
    prisma.project.count(),
    prisma.inventory.findMany({ select: { totalWeightKg: true } }),
    prisma.feedLog.findMany({ select: { dailyUse: true } }),
  ]);
  const totalWeight = inventories.reduce((s, i) => s + i.totalWeightKg, 0);
  const totalFeed = feedLogs.reduce((s, f) => s + f.dailyUse, 0);
  return { projectCount, totalWeight, totalFeed };
}

function StatCard({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">
          {value}
          {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role: string }).role;
  const metrics = await getAdminMetrics();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <strong>{session.user.name}</strong>
          {role === "ADMIN" ? " — System Overview" : " — Operations Overview"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="Total Projects"
          value={metrics.projectCount}
          color="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          label="Total Inventory Weight"
          value={metrics.totalWeight.toLocaleString()}
          unit="kg"
          color="bg-green-100"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
        />
        {role === "ADMIN" && (
          <StatCard
            label="Total Feed Consumed"
            value={metrics.totalFeed.toLocaleString()}
            unit="kg"
            color="bg-amber-100"
            icon={
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        )}
      </div>

      <div className="mt-8 card">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/projects" className="btn-secondary">View Projects →</a>
          {role === "ADMIN" && <a href="/users" className="btn-secondary">Manage Users →</a>}
        </div>
      </div>
    </div>
  );
}
