"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/Lang";
import { useProfile } from "@/components/ProfileContext";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, type Petition, type PetitionStatus, type Profile } from "@/lib/types";
import type { DictKey } from "@/i18n/dict";

interface OfficerPerformance {
  id: string;
  name: string;
  assigned: number;
  resolved: number;
  rate: number;
  avgDays: number;
}

export default function DashboardPage() {
  const { t, lang } = useLang();
  const profile = useProfile();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Petition[]>([]);
  const [filteredRecent, setFilteredRecent] = useState<Petition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [overdue, setOverdue] = useState(0);
  const [agingCounts, setAgingCounts] = useState({ under15: 0, days15To30: 0, over30: 0 });
  const [leaderboard, setLeaderboard] = useState<OfficerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: stats }, { data: allPetitions }, { count }, { data: profiles }] = await Promise.all([
        supabase.rpc("petition_stats"),
        supabase
          .from("petitions")
          .select("*")
          .order("received_date", { ascending: false }),
        supabase
          .from("petitions")
          .select("id", { count: "exact", head: true })
          .lt("next_action_date", new Date().toISOString().slice(0, 10))
          .not("status", "in", "(resolved,rejected,closed)"),
        supabase.from("profiles").select("*"),
      ]);

      const petitions = (allPetitions as Petition[]) ?? [];
      const map: Record<string, number> = {};
      
      const now = new Date();
      let u15 = 0;
      let d15to30 = 0;
      let o30 = 0;

      petitions.forEach((p) => {
        // Auto closure rule: If status is 'resolved' and action_taken_date / updated_at > 10 days ago, count as closed
        let effectiveStatus = p.status;
        if (p.status === "resolved") {
          const resolvedDateStr = p.action_taken_date || p.updated_at;
          if (resolvedDateStr) {
            const diffDays = Math.floor((now.getTime() - new Date(resolvedDateStr).getTime()) / (1000 * 3600 * 24));
            if (diffDays > 10) {
              effectiveStatus = "closed";
            }
          }
        }

        map[effectiveStatus] = (map[effectiveStatus] ?? 0) + 1;

        // Compute aging for pending petitions (new, assigned, in_progress)
        if (["new", "assigned", "in_progress"].includes(p.status)) {
          const recDate = new Date(p.received_date);
          const ageDays = Math.floor((now.getTime() - recDate.getTime()) / (1000 * 3600 * 24));
          if (ageDays < 15) u15++;
          else if (ageDays <= 30) d15to30++;
          else o30++;
        }
      });

      // Officer Leaderboard Calculation
      const officerMap = new Map<string, { name: string; assigned: number; resolved: number; totalDays: number }>();
      const profileMap = new Map<string, Profile>();
      (profiles as Profile[])?.forEach((prof) => profileMap.set(prof.id, prof));

      petitions.forEach((p) => {
        if (p.assigned_to) {
          const prof = profileMap.get(p.assigned_to);
          const name = prof ? prof.full_name : "Officer";
          const current = officerMap.get(p.assigned_to) ?? { name, assigned: 0, resolved: 0, totalDays: 0 };
          current.assigned += 1;

          if (["resolved", "closed"].includes(p.status)) {
            current.resolved += 1;
            const rec = new Date(p.received_date).getTime();
            const res = new Date(p.action_taken_date || p.updated_at).getTime();
            const days = Math.max(1, Math.floor((res - rec) / (1000 * 3600 * 24)));
            current.totalDays += days;
          }
          officerMap.set(p.assigned_to, current);
        }
      });

      const lbList: OfficerPerformance[] = Array.from(officerMap.entries()).map(([id, val]) => ({
        id,
        name: val.name,
        assigned: val.assigned,
        resolved: val.resolved,
        rate: val.assigned > 0 ? Math.round((val.resolved / val.assigned) * 100) : 0,
        avgDays: val.resolved > 0 ? Math.round(val.totalDays / val.resolved) : 0,
      })).sort((a, b) => b.rate - a.rate || b.resolved - a.resolved).slice(0, 5);

      setCounts(map);
      setRecent(petitions.slice(0, 10));
      setFilteredRecent(petitions.slice(0, 10));
      setAgingCounts({ under15: u15, days15To30: d15to30, over30: o30 });
      setLeaderboard(lbList);
      setOverdue(count ?? 0);
      setLoading(false);
    })();
  }, []);

  // Dashboard Live Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecent(recent);
    } else {
      const q = searchQuery.toLowerCase().trim();
      const filtered = recent.filter(
        (p) =>
          p.petition_no?.toLowerCase().includes(q) ||
          p.petitioner_name?.toLowerCase().includes(q) ||
          p.subject?.toLowerCase().includes(q) ||
          p.petitioner_phone?.includes(q) ||
          p.proceedings_no?.toLowerCase().includes(q)
      );
      setFilteredRecent(filtered);
    }
  }, [searchQuery, recent]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const open = (counts.new ?? 0) + (counts.assigned ?? 0) + (counts.in_progress ?? 0);

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-xl font-semibold text-slate-900 ${lang === "ta" ? "ta" : ""}`}>
            {t("welcome")}, {profile.full_name}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {profile.role === "admin" ? t("adminOnly") : t("officerNote")}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrintPDF}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <span>🖨️</span>
            <span>{t("exportPDF")}</span>
          </button>
          {profile.role === "admin" && (
            <Link href="/petitions/new" className="btn-primary text-xs">
              + {t("newPetition")}
            </Link>
          )}
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-4">
        <h2 className="text-lg font-bold text-slate-900">GOVERNMENT OF TAMIL NADU</h2>
        <h3 className="text-sm font-semibold text-slate-700">PETITION TRACKING SYSTEM (REGISTER C.F. 301)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Executive Dashboard Report — Generated on {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("totalPetitions")} value={total} tone="slate" icon="📋" />
        <Stat label={t("openPetitions")} value={open} tone="amber" icon="⏳" />
        <Stat label={t("status_resolved")} value={counts.resolved ?? 0} tone="emerald" icon="✅" />
        <Stat label={t("overdue")} value={overdue} tone="rose" icon="🚨" />
      </div>

      {/* Status Breakdown Bar */}
      <div className="card p-4 space-y-3">
        <h2 className="section-title">{t("status")}</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/petitions?status=${s}`}
              className="rounded-md border border-slate-200 p-3 text-center transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
            >
              <div className="text-xl font-semibold text-slate-900">
                {counts[s] ?? 0}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-600">
                {t(`status_${s}` as DictKey)}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Aging Analysis & Leaderboard Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Aging Chart */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>⏱️</span>
              <span>{t("pendingAgingChart")}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">({open} Open)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Link
              href="/petitions?aging=15"
              className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 transition-transform hover:scale-105"
            >
              <div className="text-2xl font-bold text-emerald-700">{agingCounts.under15}</div>
              <div className="mt-1 text-xs font-medium text-emerald-800">{t("under15Days")}</div>
            </Link>

            <Link
              href="/petitions?aging=30"
              className="rounded-lg bg-amber-50 border border-amber-200 p-3 transition-transform hover:scale-105"
            >
              <div className="text-2xl font-bold text-amber-700">{agingCounts.days15To30}</div>
              <div className="mt-1 text-xs font-medium text-amber-800">{t("days15To30")}</div>
            </Link>

            <Link
              href="/petitions?aging=30+"
              className="rounded-lg bg-rose-50 border border-rose-200 p-3 transition-transform hover:scale-105"
            >
              <div className="text-2xl font-bold text-rose-700">{agingCounts.over30}</div>
              <div className="mt-1 text-xs font-medium text-rose-800">{t("over30Days")}</div>
            </Link>
          </div>

          {/* Visual Progress Bar */}
          {open > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${(agingCounts.under15 / open) * 100}%` }}
                  className="bg-emerald-500"
                  title={`<15 Days: ${agingCounts.under15}`}
                />
                <div
                  style={{ width: `${(agingCounts.days15To30 / open) * 100}%` }}
                  className="bg-amber-500"
                  title={`15-30 Days: ${agingCounts.days15To30}`}
                />
                <div
                  style={{ width: `${(agingCounts.over30 / open) * 100}%` }}
                  className="bg-rose-500"
                  title={`>30 Days: ${agingCounts.over30}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Officer Leaderboard */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>🏆</span>
              <span>{t("leaderboard")}</span>
            </h2>
            <span className="text-xs text-slate-400">Top Officers</span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">{t("none")}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((off, idx) => (
                <div key={off.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{off.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-semibold text-emerald-600">{off.resolved}</span>
                      <span className="text-slate-400">/{off.assigned} ({off.rate}%)</span>
                    </div>
                    <div className="w-16 text-slate-500">
                      ~{off.avgDays} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Petitions Table with Integrated Search */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800">{t("recentPetitions")}</h2>
          
          {/* Dashboard Quick Search */}
          <div className="relative max-w-xs w-full print:hidden">
            <input
              type="text"
              className="input mt-0 py-1.5 pl-8 text-xs"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-slate-500">{t("loading")}</p>
        ) : filteredRecent.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{t("noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="th">{t("petitionNo")}</th>
                  <th className="th">{t("subject")}</th>
                  <th className="th">{t("petitionerName")}</th>
                  <th className="th">{t("receivedDate")}</th>
                  <th className="th">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecent.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="td whitespace-nowrap font-mono font-medium">
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
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "emerald" | "rose";
  icon: string;
}) {
  const tones = {
    slate: "text-slate-900 bg-slate-50 border-slate-200",
    amber: "text-amber-700 bg-amber-50/50 border-amber-200",
    emerald: "text-emerald-700 bg-emerald-50/50 border-emerald-200",
    rose: "text-rose-700 bg-rose-50/50 border-rose-200",
  };

  return (
    <div className={`card p-4 border ${tones[tone]}`}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

