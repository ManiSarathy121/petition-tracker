"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Emblem } from "@/components/Emblem";
import { LangToggle, useLang } from "@/components/Lang";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setBusy(false);
      return;
    }

    if (data.user) {
      // Check application-level profile authorization for Petition Tracker
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profErr || !prof || prof.app_name !== "petition-tracker") {
        await supabase.auth.signOut();
        setError("Access Denied: This user account is not authorized for the Petition Tracker application.");
        setBusy(false);
        return;
      }

      if (!prof.is_active) {
        await supabase.auth.signOut();
        setError("Your account has been deactivated. Please contact an Administrator.");
        setBusy(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="text-white"
        style={{ backgroundColor: "var(--tn-maroon)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Emblem className="h-9 w-9" />
          <div className="flex-1">
            <div className="text-[13px] leading-tight text-white/75">
              {t("govt")}
            </div>
            <div
              className={`font-semibold leading-tight ${lang === "ta" ? "ta" : ""}`}
            >
              {t("appName")}
            </div>
          </div>
          <LangToggle />
        </div>
        <div className="h-1" style={{ backgroundColor: "var(--tn-gold)" }} />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-6">
            <div className="mb-6 text-center">
              <Emblem className="mx-auto h-14 w-14 text-[color:var(--tn-maroon)]" />
              <h1
                className={`mt-3 text-lg font-semibold ${lang === "ta" ? "ta" : ""}`}
              >
                {t("signIn")}
              </h1>
              <p className="mt-1 text-xs text-slate-500">{t("formRef")}</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">{t("email")}</label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">{t("password")}</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={busy}
              >
                {busy ? t("signingIn") : t("signIn")}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            {t("loginHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
