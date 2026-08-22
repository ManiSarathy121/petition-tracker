"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang, useName } from "@/components/Lang";
import { useIsAdmin } from "@/components/ProfileContext";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { useMasterData } from "@/lib/useMasterData";
import { STATUSES, type Petition, type PetitionStatus } from "@/lib/types";
import type { DictKey } from "@/i18n/dict";
export default function PetitionsPage() {
  return (
    <Suspense fallback={null}>
      <PetitionsList />
    </Suspense>
  );
}

function PetitionsList() {
  const { t, lang } = useLang();
  const name = useName();
  const isAdmin = useIsAdmin();
  const params = useSearchParams();
  const master = useMasterData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(params.get("status") ?? "");
  const [agingParam, setAgingParam] = useState<string>(params.get("aging") ?? "");
  const [dept, setDept] = useState("");
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [village, setVillage] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE = 25;

  const run = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("search_petitions", {
      p_query: q || null,
      p_status: status || null,
      p_dept: dept || null,
      p_district: district || null,
      p_taluk: taluk || null,
      p_village: village || null,
      p_from: from || null,
      p_to: to || null,
      p_limit: 100, // fetch larger set for client aging filtering
      p_offset: page * PAGE,
    });
    if (error) console.error(error);

    let petitionsList = (data as Petition[]) ?? [];
    const now = new Date();

    // Auto closure status calculation: Resolved > 10 days -> Closed
    petitionsList = petitionsList.map((p) => {
      if (p.status === "resolved") {
        const resolvedDateStr = p.action_taken_date || p.updated_at;
        if (resolvedDateStr) {
          const diffDays = Math.floor((now.getTime() - new Date(resolvedDateStr).getTime()) / (1000 * 3600 * 24));
          if (diffDays > 10) {
            return { ...p, status: "closed" as PetitionStatus };
          }
        }
      }
      return p;
    });

    // Aging filter
    if (agingParam) {
      petitionsList = petitionsList.filter((p) => {
        if (!["new", "assigned", "in_progress"].includes(p.status)) return false;
        const recDate = new Date(p.received_date);
        const ageDays = Math.floor((now.getTime() - recDate.getTime()) / (1000 * 3600 * 24));
        if (agingParam === "15") return ageDays < 15;
        if (agingParam === "30") return ageDays >= 15 && ageDays <= 30;
        if (agingParam === "30+") return ageDays > 30;
        return true;
      });
    }

    setRows(petitionsList);
    setLoading(false);
  }, [q, status, agingParam, dept, district, taluk, village, from, to, page]);

  useEffect(() => {
    const id = setTimeout(run, 250);
    return () => clearTimeout(id);
  }, [run]);

  const clearAll = () => {
    setQ("");
    setStatus("");
    setAgingParam("");
    setDept("");
    setDistrict("");
    setTaluk("");
    setVillage("");
    setFrom("");
    setTo("");
    setPage(0);
  };

  const exportToExcel = () => {
    if (rows.length === 0) return;
    const headers = [
      "Petition No",
      "Serial No",
      "Petitioner Name",
      "Phone",
      "Subject",
      "Status",
      "Received Date",
      "Next Action Date",
      "Proceedings No",
      "Outward No",
      "Remarks"
    ];

    const csvRows = [headers.join(",")];
    rows.forEach((p) => {
      const row = [
        `"${p.petition_no || ""}"`,
        `"${p.serial_no || ""}"`,
        `"${(p.petitioner_name || "").replace(/"/g, '""')}"`,
        `"${p.petitioner_phone || ""}"`,
        `"${(p.subject || "").replace(/"/g, '""')}"`,
        `"${p.status}"`,
        `"${p.received_date}"`,
        `"${p.next_action_date || ""}"`,
        `"${p.proceedings_no || ""}"`,
        `"${p.outward_no || ""}"`,
        `"${(p.register_remarks || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `petitions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const talukOptions = district
    ? master.taluks.filter((x) => x.district_id === district)
    : master.taluks;
  const villageOptions = taluk
    ? master.villages.filter((x) => x.taluk_id === taluk)
    : master.villages;
  const activeFilters = [
    status,
    agingParam,
    dept,
    district,
    taluk,
    village,
    from,
    to,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
            {t("petitions")}
          </h1>
          {agingParam && (
            <p className="text-xs text-primary-700 font-medium mt-0.5">
              Aging Filter: {agingParam === "15" ? t("under15Days") : agingParam === "30" ? t("days15To30") : t("over30Days")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="btn-secondary text-xs flex items-center gap-1.5"
            disabled={rows.length === 0}
          >
            <span>📊</span>
            <span>{t("exportExcel")}</span>
          </button>

          {isAdmin && (
            <Link href="/petitions/new" className="btn-primary text-xs">
              + {t("newPetition")}
            </Link>
          )}
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="input mt-0 pl-9"
              placeholder={t("searchPlaceholder")}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
            <svg
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </div>
          <button
            className="btn-secondary shrink-0"
            onClick={() => setShowFilters((s) => !s)}
          >
            {t("filters")}
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-[color:var(--tn-maroon)] px-1.5 text-[10px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
        {showFilters && (
          <div className="grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t("status")}>
              <select
                className="input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("all")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status_${s}` as DictKey)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("department")}>
              <select
                className="input"
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("all")}</option>
                {master.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {name(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("district")}>
              <select
                className="input"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setTaluk("");
                  setVillage("");
                  setPage(0);
                }}
              >
                <option value="">{t("all")}</option>
                {master.districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {name(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("taluk")}>
              <select
                className="input"
                value={taluk}
                onChange={(e) => {
                  setTaluk(e.target.value);
                  setVillage("");
                  setPage(0);
                }}
              >
                <option value="">{t("all")}</option>
                {talukOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {name(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("village")}>
              <select
                className="input"
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("all")}</option>
                {villageOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {name(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`${t("receivedDate")} — ${t("from")}`}>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(0);
                }}
              />
            </Field>
            <Field label={`${t("receivedDate")} — ${t("to")}`}>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(0);
                }}
              />
            </Field>
            <div className="flex items-end">
              <button className="btn-secondary w-full" onClick={clearAll}>
                {t("clear")}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {t("noResults")}
          </p>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t("petitionNo")}</th>
                <th className="th">{t("subject")}</th>
                <th className="th">{t("petitionerName")}</th>
                <th className="th">{t("village")}</th>
                <th className="th">{t("department")}</th>
                <th className="th">{t("receivedDate")}</th>
                <th className="th">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td whitespace-nowrap">
                    <Link
                      href={`/petitions/${p.id}`}
                      className="font-mono text-xs text-[color:var(--tn-maroon)] hover:underline"
                    >
                      {p.petition_no}
                    </Link>
                  </td>
                  <td className="td max-w-[260px]">
                    <Link
                      href={`/petitions/${p.id}`}
                      className="line-clamp-2 hover:underline"
                    >
                      {p.subject}
                    </Link>
                  </td>
                  <td className="td whitespace-nowrap">
                    {p.petitioner_name}
                    {p.petitioner_phone && (
                      <div className="text-xs text-slate-400">
                        {p.petitioner_phone}
                      </div>
                    )}
                  </td>
                  <td className="td whitespace-nowrap text-xs">
                    {name(master.villages.find((v) => v.id === p.village_id))}
                  </td>
                  <td className="td whitespace-nowrap text-xs">
                    {name(
                      master.departments.find((d) => d.id === p.department_id),
                    )}
                  </td>
                  <td className="td whitespace-nowrap text-xs">
                    {p.received_date}
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge status={p.status as PetitionStatus} />
                      <PriorityBadge priority={p.priority} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          className="btn-secondary"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          ← {page}
        </button>
        <span className="text-slate-500">
          {rows.length} / page {page + 1}
        </span>
        <button
          className="btn-secondary"
          disabled={rows.length < PAGE}
          onClick={() => setPage((p) => p + 1)}
        >
          {page + 2} →
        </button>
      </div>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
