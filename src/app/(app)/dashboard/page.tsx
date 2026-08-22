"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/Lang";
import { useProfile } from "@/components/ProfileContext";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, type Petition, type PetitionStatus } from "@/lib/types";
import type { DictKey } from "@/i18n/dict";

export default function DashboardPage() {
  const { t, lang } = useLang();
  const profile = useProfile();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Petition[]>([]);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: stats }, { data: rows }, { count }] = await Promise.all([
        supabase.rpc("petition_stats"),
        supabase
          .from("petitions")
          .select("*")
          .order("received_date", { ascending: false })
          .limit(8),
        supabase
          .from("petitions")
          .select("id", { count: "exact", head: true })
          .lt("next_action_date", new Date().toISOString().slice(0, 10))
          .not("status", "in", "(resolved,rejected)"),
      ]);

      const map: Record<string, number> = {};
      (stats as { status: string; count: number }[] | null)?.forEach((s) => {
        map[s.status] = Number(s.count);
      });
      setCounts(map);
      setRecent((rows as Petition[]) ?? []);
      setOverdue(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const open =
    (counts.new ?? 0) + (counts.assigned ?? 0) + (counts.in_progress ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
          {t("welcome")}, {profile.full_name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile.role === "admin" ? t("adminOnly") : t("officerNote")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("totalPetitions")} value={total} tone="slate" />
        <Stat label={t("openPetitions")} value={open} tone="amber" />
        <Stat
          label={t("status_resolved")}
          value={counts.resolved ?? 0}
          tone="emerald"
        />
        <Stat label={t("overdue")} value={overdue} tone="rose" />
      </div>

      <div className="card p-4">
        <h2 className="section-title">{t("status")}</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/petitions?status=${s}`}
              className="rounded-md border border-slate-200 p-3 text-center hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="text-2xl font-semibold text-slate-900">
                {counts[s] ?? 0}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t(`status_${s}` as DictKey)}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">{t("recentPetitions")}</h2>
          <Link
            href="/petitions"
            className="text-xs text-[color:var(--tn-maroon)] hover:underline"
          >
            {t("petitions")} →
          </Link>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">{t("loading")}</p>
        ) : recent.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{t("noResults")}</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t("petitionNo")}</th>
                <th className="th">{t("subject")}</th>
                <th className="th">{t("petitionerName")}</th>
                <th className="th">{t("receivedDate")}</th>
                <th className="th">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td whitespace-nowrap font-mono text-xs">
                    <Link
                      href={`/petitions/${p.id}`}
                      className="text-[color:var(--tn-maroon)] hover:underline"
                    >
                      {p.petition_no}
                    </Link>
                  </td>
                  <td className="td max-w-xs truncate">{p.subject}</td>
                  <td className="td whitespace-nowrap">{p.petitioner_name}</td>
                  <td className="td whitespace-nowrap">{p.received_date}</td>
                  <td className="td">
                    <StatusBadge status={p.status as PetitionStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    slate: "text-slate-900",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
  };
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}
