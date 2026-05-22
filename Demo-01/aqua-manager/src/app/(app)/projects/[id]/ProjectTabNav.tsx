"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/documents`, label: "Documents" },
    { href: `${base}/inventory`, label: "Inventory" },
    { href: `${base}/feed`, label: "Feed Log" },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-1">
        {tabs.map((tab) => {
          const active =
            tab.href === base
              ? pathname === base
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                active
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
