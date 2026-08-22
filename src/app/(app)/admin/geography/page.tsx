"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang, useName } from "@/components/Lang";
import { useIsAdmin } from "@/components/ProfileContext";
import { useMasterData } from "@/lib/useMasterData";
import type { VillageKind } from "@/lib/types";

const KINDS: VillageKind[] = [
  "village",
  "division",
  "ward",
  "panchayat",
  "municipality",
];

export default function GeographyPage() {
  const { t, lang } = useLang();
  const name = useName();
  const isAdmin = useIsAdmin();
  const master = useMasterData();
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  if (!isAdmin) return <p className="card p-6 text-sm">{t("adminOnly")}</p>;

  const supabase = createClient();

  const del = async (table: string, id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setError(error.message);
    master.reload();
  };

  const taluks = master.taluks.filter((x) => x.district_id === district);
  const villages = master.villages.filter((x) => x.taluk_id === taluk);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
          {t("geography")}
        </h1>
        <button
          onClick={() => setShowBulkImport(true)}
          className="btn-secondary flex items-center gap-2 text-xs font-medium"
        >
          <span>📥</span>
          <span>{t("bulkImport")}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Districts Column with Search */}
        <Column
          title={t("district")}
          items={master.districts.map((d) => ({
            id: d.id,
            label: name(d),
            rawNameEn: d.name_en,
            rawNameTa: d.name_ta ?? "",
            sub: d.code ?? "",
          }))}
          selected={district}
          onSelect={(id) => {
            setDistrict(id);
            setTaluk("");
          }}
          onDelete={(id) => del("districts", id)}
          form={
            <AddForm
              buttonLabel={t("addDistrict")}
              onSubmit={async (v) => {
                const { error } = await supabase.from("districts").insert({
                  name_en: v.name_en,
                  name_ta: v.name_ta || null,
                  code: v.code || null,
                });
                if (error) setError(error.message);
                master.reload();
              }}
            />
          }
        />

        {/* Taluks Column with Search */}
        <Column
          title={t("taluk")}
          empty={!district ? t("selectDistrict") : undefined}
          items={taluks.map((d) => ({
            id: d.id,
            label: name(d),
            rawNameEn: d.name_en,
            rawNameTa: d.name_ta ?? "",
            sub: d.code ?? "",
          }))}
          selected={taluk}
          onSelect={setTaluk}
          onDelete={(id) => del("taluks", id)}
          form={
            district ? (
              <AddForm
                buttonLabel={t("addTaluk")}
                onSubmit={async (v) => {
                  const { error } = await supabase.from("taluks").insert({
                    district_id: district,
                    name_en: v.name_en,
                    name_ta: v.name_ta || null,
                    code: v.code || null,
                  });
                  if (error) setError(error.message);
                  master.reload();
                }}
              />
            ) : null
          }
        />

        {/* Villages Column with Search */}
        <Column
          title={t("village")}
          empty={!taluk ? t("selectTaluk") : undefined}
          items={villages.map((d) => ({
            id: d.id,
            label: name(d),
            rawNameEn: d.name_en,
            rawNameTa: d.name_ta ?? "",
            sub: d.kind,
          }))}
          onDelete={(id) => del("villages", id)}
          form={
            taluk ? (
              <AddForm
                buttonLabel={t("addVillage")}
                withKind
                onSubmit={async (v) => {
                  const { error } = await supabase.from("villages").insert({
                    taluk_id: taluk,
                    name_en: v.name_en,
                    name_ta: v.name_ta || null,
                    code: v.code || null,
                    kind: v.kind ?? "village",
                  });
                  if (error) setError(error.message);
                  master.reload();
                }}
              />
            ) : null
          }
        />
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={(msg) => {
            setSuccess(msg);
            master.reload();
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

function Column({
  title,
  items,
  selected,
  onSelect,
  onDelete,
  form,
  empty,
}: {
  title: string;
  items: { id: string; label: string; rawNameEn?: string; rawNameTa?: string; sub?: string }[];
  selected?: string;
  onSelect?: (id: string) => void;
  onDelete: (id: string) => void;
  form: React.ReactNode;
  empty?: string;
}) {
  const { t } = useLang();
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      i.label.toLowerCase().includes(q) ||
      (i.rawNameEn && i.rawNameEn.toLowerCase().includes(q)) ||
      (i.rawNameTa && i.rawNameTa.toLowerCase().includes(q)) ||
      (i.sub && i.sub.toLowerCase().includes(q))
    );
  });

  return (
    <div className="card flex flex-col">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold flex items-center justify-between">
        <span>{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {filteredItems.length} / {items.length}
        </span>
      </h2>

      {!empty && (
        <div className="border-b border-slate-100 p-2">
          <input
            type="text"
            className="input mt-0 text-xs py-1.5"
            placeholder={t("searchGeography")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {empty ? (
        <p className="p-4 text-sm text-slate-400">{empty}</p>
      ) : (
        <>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {filteredItems.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-400">
                {search ? t("none") : t("none")}
              </li>
            )}
            {filteredItems.map((i) => (
              <li
                key={i.id}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  selected === i.id
                    ? "bg-slate-100 font-medium text-primary-700"
                    : "hover:bg-slate-50"
                }`}
              >
                <button
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => onSelect?.(i.id)}
                  disabled={!onSelect}
                >
                  {i.label}
                  {i.sub && (
                    <span className="ml-2 text-xs text-slate-400">({i.sub})</span>
                  )}
                </button>
                <button
                  className="text-xs text-rose-600 hover:underline px-1"
                  onClick={() => onDelete(i.id)}
                  title={t("delete")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 p-3">{form}</div>
        </>
      )}
    </div>
  );
}

function AddForm({
  buttonLabel,
  onSubmit,
  withKind = false,
}: {
  buttonLabel: string;
  withKind?: boolean;
  onSubmit: (v: {
    name_en: string;
    name_ta: string;
    code: string;
    kind?: VillageKind;
  }) => Promise<void>;
}) {
  const { t } = useLang();
  const [v, setV] = useState({
    name_en: "",
    name_ta: "",
    code: "",
    kind: "village" as VillageKind,
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSubmit(v);
        setV({ name_en: "", name_ta: "", code: "", kind: "village" });
        setBusy(false);
      }}
    >
      <input
        required
        className="input mt-0"
        placeholder={t("name_en")}
        value={v.name_en}
        onChange={(e) => setV({ ...v, name_en: e.target.value })}
      />
      <input
        className="input mt-0 ta"
        placeholder={t("name_ta")}
        value={v.name_ta}
        onChange={(e) => setV({ ...v, name_ta: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className="input mt-0"
          placeholder={t("code")}
          value={v.code}
          onChange={(e) => setV({ ...v, code: e.target.value })}
        />
        {withKind && (
          <select
            className="input mt-0"
            value={v.kind}
            onChange={(e) =>
              setV({ ...v, kind: e.target.value as VillageKind })
            }
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? t("saving") : buttonLabel}
      </button>
    </form>
  );
}

function BulkImportModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useLang();
  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const downloadTemplate = () => {
    const template = `district_code,district_name_en,district_name_ta,taluk_name_en,taluk_name_ta,village_name_en,village_name_ta,kind
RNP,Ranipet,இராணிப்பேட்டை,Nemili,நெமிலி,Ocheri,ஓச்சரி,village
RNP,Ranipet,இராணிப்பேட்டை,Nemili,நெமிலி,Ocheri Gram Panchayat,ஓச்சரி கிராம ஊராட்சி,panchayat
RNP,Ranipet,இராணிப்பேட்டை,Nemili,நெமிலி,Ocheri Pudur,ஓச்சரி புதூர்,village
CHN,Chennai,சென்னை,Ambattur,அம்பத்தூர்,Kallikuppam,கல்லிக்குப்பம்,division`;
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geography_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCsvText(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setBusy(true);
    setStatusMsg(t("importing"));

    try {
      const supabase = createClient();
      const lines = csvText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      
      let importedCount = 0;
      let headerSkipped = false;

      // Cache existing districts and taluks to reduce DB calls
      const { data: existingDistricts } = await supabase.from("districts").select("*");
      const { data: existingTaluks } = await supabase.from("taluks").select("*");

      const distMap = new Map<string, string>(); // code/name -> id
      existingDistricts?.forEach((d) => {
        if (d.code) distMap.set(d.code.toUpperCase(), d.id);
        distMap.set(d.name_en.toUpperCase(), d.id);
      });

      const talukMap = new Map<string, string>(); // `${distId}_${talukName}` -> id
      existingTaluks?.forEach((t) => {
        talukMap.set(`${t.district_id}_${t.name_en.toUpperCase()}`, t.id);
      });

      for (const line of lines) {
        // Skip header if line matches expected column names
        if (!headerSkipped && (line.toLowerCase().includes("district_code") || line.toLowerCase().includes("district_name_en"))) {
          headerSkipped = true;
          continue;
        }

        const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length < 3) continue;

        const distCode = cols[0] || "";
        const distNameEn = cols[1] || "";
        const distNameTa = cols[2] || "";
        const talukNameEn = cols[3] || "";
        const talukNameTa = cols[4] || "";
        const villageNameEn = cols[5] || "";
        const villageNameTa = cols[6] || "";
        const kind = (cols[7] || "village") as VillageKind;

        if (!distNameEn) continue;

        // 1. Resolve District
        let distId = distMap.get(distCode.toUpperCase()) || distMap.get(distNameEn.toUpperCase());
        if (!distId) {
          const { data: newDist, error: dErr } = await supabase
            .from("districts")
            .insert({ name_en: distNameEn, name_ta: distNameTa || null, code: distCode || null })
            .select("id")
            .single();

          if (dErr || !newDist) {
            // Might already exist
            const { data: fallbackDist } = await supabase
              .from("districts")
              .select("id")
              .eq("name_en", distNameEn)
              .single();
            distId = fallbackDist?.id;
          } else {
            distId = newDist.id;
          }

          if (distId) {
            if (distCode) distMap.set(distCode.toUpperCase(), distId);
            distMap.set(distNameEn.toUpperCase(), distId);
          }
        }

        if (!distId) continue;

        // 2. Resolve Taluk
        let talukId: string | undefined;
        if (talukNameEn) {
          const key = `${distId}_${talukNameEn.toUpperCase()}`;
          talukId = talukMap.get(key);
          if (!talukId) {
            const { data: newTaluk, error: tErr } = await supabase
              .from("taluks")
              .insert({ district_id: distId, name_en: talukNameEn, name_ta: talukNameTa || null })
              .select("id")
              .single();

            if (tErr || !newTaluk) {
              const { data: fallbackTaluk } = await supabase
                .from("taluks")
                .select("id")
                .eq("district_id", distId)
                .eq("name_en", talukNameEn)
                .single();
              talukId = fallbackTaluk?.id;
            } else {
              talukId = newTaluk.id;
            }

            if (talukId) talukMap.set(key, talukId);
          }
        }

        // 3. Insert Village if village name provided
        if (talukId && villageNameEn) {
          const { error: vErr } = await supabase.from("villages").insert({
            taluk_id: talukId,
            name_en: villageNameEn,
            name_ta: villageNameTa || null,
            kind: KINDS.includes(kind) ? kind : "village",
          });

          if (!vErr) importedCount++;
        }
      }

      onSuccess(`${t("importSuccess")} (${importedCount} ${t("village")})`);
      onClose();
    } catch (err: any) {
      onError(err.message || "Failed to import CSV");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="card max-w-2xl w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-800">
            {t("bulkImportTitle")}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500">{t("bulkImportHint")}</p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>{t("downloadTemplate")}</span>
          </button>
          
          <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
            <span>📂</span>
            <span>{t("upload")}</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={7}
          className="input font-mono text-xs"
          placeholder={t("csvPlaceholder")}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />

        {statusMsg && <p className="text-xs text-primary-600 font-medium">{statusMsg}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
            disabled={busy}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="btn-primary text-xs"
            disabled={busy || !csvText.trim()}
          >
            {busy ? t("importing") : t("processImport")}
          </button>
        </div>
      </div>
    </div>
  );
}

