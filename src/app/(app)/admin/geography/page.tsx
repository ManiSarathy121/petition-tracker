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
      <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
        {t("geography")}
      </h1>
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Districts */}
        <Column
          title={t("district")}
          items={master.districts.map((d) => ({
            id: d.id,
            label: name(d),
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
        {/* Taluks */}
        <Column
          title={t("taluk")}
          empty={!district ? t("selectDistrict") : undefined}
          items={taluks.map((d) => ({
            id: d.id,
            label: name(d),
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
        {/* Villages */}
        <Column
          title={t("village")}
          empty={!taluk ? t("selectTaluk") : undefined}
          items={villages.map((d) => ({
            id: d.id,
            label: name(d),
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
  items: { id: string; label: string; sub?: string }[];
  selected?: string;
  onSelect?: (id: string) => void;
  onDelete: (id: string) => void;
  form: React.ReactNode;
  empty?: string;
}) {
  const { t } = useLang();
  return (
    <div className="card flex flex-col">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
        {title}
        <span className="ml-2 text-xs font-normal text-slate-400">
          {items.length}
        </span>
      </h2>
      {empty ? (
        <p className="p-4 text-sm text-slate-400">{empty}</p>
      ) : (
        <>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-400">{t("none")}</li>
            )}
            {items.map((i) => (
              <li
                key={i.id}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  selected === i.id
                    ? "bg-slate-100 font-medium"
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
                    <span className="ml-2 text-xs text-slate-400">{i.sub}</span>
                  )}
                </button>
                <button
                  className="text-xs text-rose-600 hover:underline"
                  onClick={() => onDelete(i.id)}
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
