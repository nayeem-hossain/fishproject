"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/documents", label: "Documents" },
  { href: "/inventory", label: "Inventory" },
  { href: "/feed", label: "Feed" }
] as const;

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="surface-soft overflow-hidden p-2">
      <div className="grid gap-2 md:grid-cols-4">
        {tabs.map((tab) => {
          const href = `/projects/${projectId}${tab.href}`;
          const active = pathname === href || (tab.href === "" && pathname === `/projects/${projectId}`);

          return (
            <Link
              key={tab.href || "overview"}
              href={href}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                active ? "bg-sky-400 text-slate-950" : "text-slate-200 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}