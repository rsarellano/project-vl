"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getApiBaseUrl, parseFastAPIError } from "@/lib/api";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { declareSession, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const base = getApiBaseUrl();
    const path = mode === "login" ? "/api/users/login" : "/api/users/create";

    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(await parseFastAPIError(res));
      }

      if (mode === "register") {
        setMessage("Account created. You can log in now.");
        setMode("login");
        setPassword("");
        return;
      }

      declareSession(email);
      await refresh();
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Project VL
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "login"
            ? "Sign in to save your workspace preferences."
            : "Register with your email and password."}
        </p>

        <div className="mt-6 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                : "text-slate-500"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-blue-600 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-blue-600 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
