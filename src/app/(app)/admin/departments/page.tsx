"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { L, useLang } from "@/components/Lang";
import { useIsAdmin } from "@/components/ProfileContext";
import { useMasterData } from "@/lib/useMasterData";
export default function DepartmentsPage() {
  const { t, lang } = useLang();
  const isAdmin = useIsAdmin();
  const master = useMasterData();
  const [form, setForm] = useState({
    code: "",
    name_en: "",
    name_ta: "",
    description: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isAdmin) return <p className="card p-6 text-sm">{t("adminOnly")}</p>;
  const reset = () => {
    setForm({ code: "", name_en: "", name_ta: "", description: "" });
    setEditing(null);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      code: form.code || null,
      name_en: form.name_en,
      name_ta: form.name_ta || null,
      description: form.description || null,
    };
    const { error } = editing
      ? await supabase.from("departments").update(payload).eq("id", editing)
      : await supabase.from("departments").insert(payload);
    setBusy(false);
    if (error) return setError(error.message);
    reset();
    master.reload();
  };
  const toggle = async (id: string, active: boolean) => {
    const supabase = createClient();
    await supabase
      .from("departments")
      .update({ is_active: !active })
      .eq("id", id);
    master.reload();
  };
  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) setError(error.message);
    master.reload();
  };
  return (
    <div className="space-y-5">
      <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
        {t("departments")}
      </h1>
      <form onSubmit={save} className="card p-5">
        <h2 className="section-title">{editing ? t("edit") : t("add")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">
              <L k="code" />
            </label>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              <L k="name_en" />
            </label>
            <input
              required
              className="input"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              <L k="name_ta" />
            </label>
            <input
              className="input"
              value={form.name_ta}
              onChange={(e) => setForm({ ...form, name_ta: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" disabled={busy}>
              {busy ? t("saving") : t("save")}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={reset}>
                {t("cancel")}
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">{t("code")}</th>
              <th className="th">{t("name_en")}</th>
              <th className="th">{t("name_ta")}</th>
              <th className="th">{t("status")}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {master.departments.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{d.code ?? "—"}</td>
                <td className="td">{d.name_en}</td>
                <td className="td ta">{d.name_ta ?? "—"}</td>
                <td className="td">
                  <button
                    onClick={() => toggle(d.id, d.is_active)}
                    className={`badge ${d.is_active ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                  >
                    {d.is_active ? t("active") : t("inactive")}
                  </button>
                </td>
                <td className="td whitespace-nowrap text-right">
                  <button
                    className="mr-3 text-xs text-[color:var(--tn-maroon)] hover:underline"
                    onClick={() => {
                      setEditing(d.id);
                      setForm({
                        code: d.code ?? "",
                        name_en: d.name_en,
                        name_ta: d.name_ta ?? "",
                        description: d.description ?? "",
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => remove(d.id)}
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
