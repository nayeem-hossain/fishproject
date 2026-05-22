"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setErrorMessage(null);

      const username = String(formData.get("username") ?? "");
      const password = String(formData.get("password") ?? "");

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (!result || result.error) {
        setErrorMessage("Invalid username or password.");
        return;
      }

      router.replace(result.url ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label className="label-text" htmlFor="username">
          Username
        </label>
        <input id="username" name="username" type="text" className="input-field" autoComplete="username" required />
      </div>

      <div>
        <label className="label-text" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" className="input-field" autoComplete="current-password" required />
      </div>

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      <button type="submit" disabled={isPending} className="button-primary w-full">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}