"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function SiteNav() {
  const { user, status, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-red-200/60 bg-red-50/90 backdrop-blur dark:border-red-900/50 dark:bg-red-950/90">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Project VL
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/app"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Workspace
          </Link>

          {status === "loading" ? (
            <span className="px-3 py-1.5 text-slate-400">…</span>
          ) : user ? (
            <>
              <span className="hidden text-slate-500 sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
