"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/Lang";
import { useProfile } from "@/components/ProfileContext";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, type Petition, type PetitionStatus, type Profile } from "@/lib/types";
import type { DictKey } from "@/i18n/dict";

declare global {
  interface Window {
    html2pdf?: any;
  }
}

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

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Load html2pdf.js dynamically if not present
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const element = document.getElementById("dashboard-report-content");
      if (element && window.html2pdf) {
        const opt = {
          margin:       [8, 8, 8, 8],
          filename:     `petition_dashboard_report_${new Date().toISOString().slice(0, 10)}.pdf`,
          image:        { type: "jpeg", quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" }
        };
        await window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (err) {
      console.error("PDF Download error:", err);
      window.print();
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-report-content">
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
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="btn-secondary flex items-center gap-2 text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          >
            <span>{downloadingPDF ? "⏳" : "📄"}</span>
            <span>{downloadingPDF ? "Downloading PDF..." : "Download PDF Report"}</span>
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

      {/* Visual Donut Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart 1: Status Distribution */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>📊</span>
              <span>{t("status")} Distribution Donut</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">({total} Total)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-2">
            <StatusDonutChart counts={counts} total={total} />
            
            <div className="grid grid-cols-2 gap-2 text-xs w-full sm:w-auto">
              {STATUSES.map((s) => (
                <Link
                  key={s}
                  href={`/petitions?status=${s}`}
                  className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        s === "new" ? "bg-sky-500" :
                        s === "assigned" ? "bg-violet-500" :
                        s === "in_progress" ? "bg-amber-500" :
                        s === "resolved" ? "bg-emerald-500" :
                        s === "closed" ? "bg-slate-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="text-slate-700">{t(`status_${s}` as DictKey)}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{counts[s] ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart 2: Pending Aging Analysis */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>🍩</span>
              <span>{t("pendingAgingChart")}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">({open} Open)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-2">
            <AgingDonutChart agingCounts={agingCounts} open={open} />

            <div className="space-y-2 text-xs w-full sm:w-auto">
              <Link
                href="/petitions?aging=15"
                className="flex items-center justify-between gap-4 p-2 rounded-lg bg-emerald-50 border border-emerald-200 transition-transform hover:scale-102"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-900">{t("under15Days")}</span>
                </div>
                <span className="font-bold text-emerald-800 text-sm">{agingCounts.under15}</span>
              </Link>

              <Link
                href="/petitions?aging=30"
                className="flex items-center justify-between gap-4 p-2 rounded-lg bg-amber-50 border border-amber-200 transition-transform hover:scale-102"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-900">{t("days15To30")}</span>
                </div>
                <span className="font-bold text-amber-800 text-sm">{agingCounts.days15To30}</span>
              </Link>

              <Link
                href="/petitions?aging=30+"
                className="flex items-center justify-between gap-4 p-2 rounded-lg bg-rose-50 border border-rose-200 transition-transform hover:scale-102"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="font-medium text-rose-900">{t("over30Days")}</span>
                </div>
                <span className="font-bold text-rose-800 text-sm">{agingCounts.over30}</span>
              </Link>
            </div>
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

function StatusDonutChart({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-slate-100 font-bold text-slate-400 text-xs">
        0 Petitions
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    new: "#0284c7",       // sky-600
    assigned: "#7c3aed",  // violet-600
    in_progress: "#d97706",// amber-600
    resolved: "#059669",  // emerald-600
    closed: "#475569",    // slate-600
    rejected: "#e11d48",  // rose-600
  };

  let cumulativePercent = 0;
  const segments = STATUSES.map((s) => {
    const count = counts[s] ?? 0;
    const percent = (count / total) * 100;
    const dashArray = `${percent} ${100 - percent}`;
    const dashOffset = -cumulativePercent;
    cumulativePercent += percent;
    return { status: s, count, percent, dashArray, dashOffset, color: colorMap[s] };
  }).filter((seg) => seg.count > 0);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
        {segments.map((seg) => (
          <circle
            key={seg.status}
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            className="transition-all duration-500 hover:opacity-80"
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-slate-900">{total}</span>
        <span className="text-[10px] text-slate-500 font-medium">Petitions</span>
      </div>
    </div>
  );
}

function AgingDonutChart({ agingCounts, open }: { agingCounts: { under15: number; days15To30: number; over30: number }; open: number }) {
  if (open === 0) {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-slate-100 font-bold text-slate-400 text-xs">
        0 Pending
      </div>
    );
  }

  const u15Pct = (agingCounts.under15 / open) * 100;
  const d30Pct = (agingCounts.days15To30 / open) * 100;
  const o30Pct = (agingCounts.over30 / open) * 100;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
        {/* <15 Days (Emerald) */}
        {agingCounts.under15 > 0 && (
          <circle
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="6"
            strokeDasharray={`${u15Pct} ${100 - u15Pct}`}
            strokeDashoffset="0"
          />
        )}
        {/* 15-30 Days (Amber) */}
        {agingCounts.days15To30 > 0 && (
          <circle
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="6"
            strokeDasharray={`${d30Pct} ${100 - d30Pct}`}
            strokeDashoffset={-u15Pct}
          />
        )}
        {/* >30 Days (Rose) */}
        {agingCounts.over30 > 0 && (
          <circle
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="#f43f5e"
            strokeWidth="6"
            strokeDasharray={`${o30Pct} ${100 - o30Pct}`}
            strokeDashoffset={-(u15Pct + d30Pct)}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-amber-700">{open}</span>
        <span className="text-[10px] text-slate-500 font-medium">Pending</span>
      </div>
    </div>
  );
}

