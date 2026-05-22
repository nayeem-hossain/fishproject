"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/lib/rbac";

type NavigationItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const NAVIGATION: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/users", label: "User Management", adminOnly: true }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function Sidebar({ role, username }: { role: Role; username: string }) {
  const pathname = usePathname();

  return (
    <aside className="surface flex h-full flex-col gap-6 p-6 lg:sticky lg:top-0 lg:h-screen lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r border-white/10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">FishProject</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Operations Console</h1>
        <p className="mt-2 text-sm text-slate-400">Signed in as {username}</p>
        <span className="mt-3 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
          {role}
        </span>
      </div>

      <nav className="space-y-2">
        {NAVIGATION.filter((item) => !item.adminOnly || role === "ADMIN").map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? "bg-sky-400 text-slate-950" : "text-slate-200 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}