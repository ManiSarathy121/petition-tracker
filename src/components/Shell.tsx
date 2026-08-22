"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Emblem } from "./Emblem";
import { LangToggle, useLang } from "./Lang";
import { ProfileProvider } from "./ProfileContext";
import type { DictKey } from "@/i18n/dict";
import type { Profile } from "@/lib/types";

const NAV: { href: string; key: DictKey; adminOnly?: boolean }[] = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/petitions", key: "petitions" },
  { href: "/petitions/new", key: "newPetition", adminOnly: true },
];

const ADMIN_NAV: { href: string; key: DictKey }[] = [
  { href: "/admin/departments", key: "departments" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/geography", key: "geography" },
];

export function Shell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const isAdmin = profile.role === "admin";

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const linkCls = (href: string) => {
    const active =
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return `block rounded-md px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-[color:var(--tn-maroon)] text-white font-medium"
        : "text-slate-700 hover:bg-slate-100"
    }`;
  };

  return (
    <div className="min-h-screen">
      <header
        className="text-white"
        style={{ backgroundColor: "var(--tn-maroon)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            className="lg:hidden rounded p-1.5 hover:bg-white/10"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <Emblem className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] leading-tight text-white/75">
              {t("govt")}
            </div>
            <div
              className={`truncate font-semibold leading-tight ${lang === "ta" ? "ta" : ""}`}
            >
              {t("appName")}
            </div>
          </div>

          <LangToggle />

          <div className="hidden sm:block text-right text-xs leading-tight">
            <div className="font-medium">{profile.full_name}</div>
            <div className="text-white/70">
              {t(isAdmin ? "role_admin" : "role_officer")}
            </div>
          </div>
          <button
            onClick={signOut}
            className="rounded border border-white/30 px-2.5 py-1 text-xs hover:bg-white/10"
          >
            {t("signOut")}
          </button>
        </div>
        <div className="h-1" style={{ backgroundColor: "var(--tn-gold)" }} />
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside
          className={`${open ? "block" : "hidden"} lg:block w-56 shrink-0 space-y-1`}
        >
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={linkCls(n.href)}
              onClick={() => setOpen(false)}
            >
              {t(n.key)}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("administration")}
              </div>
              {ADMIN_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={linkCls(n.href)}
                  onClick={() => setOpen(false)}
                >
                  {t(n.key)}
                </Link>
              ))}
            </>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <ProfileProvider profile={profile}>{children}</ProfileProvider>
        </main>
      </div>
    </div>
  );
}
