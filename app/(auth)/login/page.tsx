import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="surface grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">FishProject</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Project and inventory management for pond operations.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
            Sign in to manage parent projects, pond sub-projects, document tracking, inventory weight calculations, and feed logs from one protected workspace.
          </p>

          <div className="mt-10 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="surface-soft p-4">
              <p className="font-semibold text-white">JWT sessions</p>
              <p className="mt-2">Credential-based login with role claims in session tokens.</p>
            </div>
            <div className="surface-soft p-4">
              <p className="font-semibold text-white">Protected routes</p>
              <p className="mt-2">Middleware and server actions enforce route-level and mutation-level permissions.</p>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10 lg:p-12">
          <div className="surface-soft p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Use your seeded project account to continue.</p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}