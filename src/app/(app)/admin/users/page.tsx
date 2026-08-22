"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { L, useLang, useName } from "@/components/Lang";
import { useIsAdmin } from "@/components/ProfileContext";
import { useMasterData } from "@/lib/useMasterData";
import type { Profile, Role } from "@/lib/types";
export default function UsersPage() {
  const { t, lang } = useLang();
  const name = useName();
  const isAdmin = useIsAdmin();
  const master = useMasterData();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    full_name_ta: "",
    phone: "",
    designation: "",
    role: "officer" as Role,
    department_id: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [jurisdictionFor, setJurisdictionFor] = useState<Profile | null>(null);
  if (!isAdmin) return <p className="card p-6 text-sm">{t("adminOnly")}</p>;
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_create_user", {
      p_email: form.email,
      p_password: form.password,
      p_full_name: form.full_name,
      p_role: form.role,
      p_department: form.department_id || null,
      p_designation: form.designation || null,
      p_phone: form.phone || null,
      p_full_name_ta: form.full_name_ta || null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setOk(`${form.email} — ${t("createUser")} ✓`);
    setForm({
      email: "",
      password: "",
      full_name: "",
      full_name_ta: "",
      phone: "",
      designation: "",
      role: "officer",
      department_id: "",
    });
    master.reload();
  };
  const toggleActive = async (p: Profile) => {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    master.reload();
  };
  const resetPassword = async (p: Profile) => {
    const pw = prompt(`${t("resetPassword")} — ${p.email}`);
    if (!pw) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_password", {
      p_user_id: p.id,
      p_password: pw,
    });
    if (error) setError(error.message);
    else setOk(`${p.email} — ${t("resetPassword")} ✓`);
  };
  const removeUser = async (p: Profile) => {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_delete_user", {
      p_user_id: p.id,
    });
    if (error) setError(error.message);
    master.reload();
  };
  return (
    <div className="space-y-5">
      <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
        {t("users")}
      </h1>
      <form onSubmit={create} className="card p-5">
        <h2 className="section-title">
          <L k="createUser" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">
              <L k="fullName" />
            </label>
            <input
              required
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              <L k="name_ta" />
            </label>
            <input
              className="input ta"
              value={form.full_name_ta}
              onChange={(e) =>
                setForm({ ...form, full_name_ta: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">
              <L k="email" />
            </label>
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              <L k="password" />
            </label>
            <input
              required
              minLength={8}
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              <L k="role" />
            </label>
            <select
              className="input"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="officer">{t("role_officer")}</option>
              <option value="admin">{t("role_admin")}</option>
            </select>
          </div>
          <div>
            <label className="label">
              <L k="department" />
            </label>
            <select
              className="input"
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
            >
              <option value="">—</option>
              {master.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {name(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <L k="designation" />
            </label>
            <input
              className="input"
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">
              <L k="petitionerPhone" />
            </label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>
            {busy ? t("saving") : t("createUser")}
          </button>
          {error && <span className="text-sm text-rose-600">{error}</span>}
          {ok && <span className="text-sm text-emerald-600">{ok}</span>}
        </div>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">{t("fullName")}</th>
              <th className="th">{t("email")}</th>
              <th className="th">{t("role")}</th>
              <th className="th">{t("department")}</th>
              <th className="th">{t("jurisdiction")}</th>
              <th className="th">{t("status")}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {master.officers.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td">
                  {p.full_name}
                  {p.designation && (
                    <div className="text-xs text-slate-400">
                      {p.designation}
                    </div>
                  )}
                </td>
                <td className="td text-xs">{p.email}</td>
                <td className="td text-xs">
                  {t(p.role === "admin" ? "role_admin" : "role_officer")}
                </td>
                <td className="td text-xs">
                  {name(
                    master.departments.find((d) => d.id === p.department_id),
                  )}
                </td>
                <td className="td">
                  <button
                    className="text-xs text-[color:var(--tn-maroon)] hover:underline"
                    onClick={() => setJurisdictionFor(p)}
                  >
                    {t("edit")}
                  </button>
                </td>
                <td className="td">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`badge ${p.is_active ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                  >
                    {p.is_active ? t("active") : t("inactive")}
                  </button>
                </td>
                <td className="td whitespace-nowrap text-right">
                  <button
                    className="mr-3 text-xs text-slate-600 hover:underline"
                    onClick={() => resetPassword(p)}
                  >
                    {t("resetPassword")}
                  </button>
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => removeUser(p)}
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jurisdictionFor && (
        <JurisdictionModal
          profile={jurisdictionFor}
          onClose={() => setJurisdictionFor(null)}
        />
      )}
    </div>
  );
}
function JurisdictionModal({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const { t } = useLang();
  const nameOf = useName();
  const master = useMasterData();
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedTaluks, setSelectedTaluks] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: pv }, { data: pt }] = await Promise.all([
        supabase
          .from("profile_villages")
          .select("village_id")
          .eq("profile_id", profile.id),
        supabase
          .from("profile_taluks")
          .select("taluk_id")
          .eq("profile_id", profile.id),
      ]);
      setSelected(new Set((pv ?? []).map((r) => r.village_id as string)));
      setSelectedTaluks(new Set((pt ?? []).map((r) => r.taluk_id as string)));
    })();
  }, [profile.id]);
  const save = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("profile_villages")
      .delete()
      .eq("profile_id", profile.id);
    await supabase.from("profile_taluks").delete().eq("profile_id", profile.id);
    if (selected.size)
      await supabase
        .from("profile_villages")
        .insert(
          [...selected].map((village_id) => ({
            profile_id: profile.id,
            village_id,
          })),
        );
    if (selectedTaluks.size)
      await supabase
        .from("profile_taluks")
        .insert(
          [...selectedTaluks].map((taluk_id) => ({
            profile_id: profile.id,
            taluk_id,
          })),
        );
    setBusy(false);
    onClose();
  };
  const taluks = master.taluks.filter(
    (x) => !district || x.district_id === district,
  );
  const villages = master.villages.filter(
    (x) => !taluk || x.taluk_id === taluk,
  );
  const flip = (
    set: Set<string>,
    setter: (s: Set<string>) => void,
    id: string,
  ) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-3xl p-5">
        <h2 className="section-title">
          {t("jurisdiction")} — {profile.full_name}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">{t("district")}</label>
            <select
              className="input"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setTaluk("");
              }}
            >
              <option value="">{t("all")}</option>
              {master.districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {nameOf(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("taluk")}</label>
            <select
              className="input"
              value={taluk}
              onChange={(e) => setTaluk(e.target.value)}
            >
              <option value="">{t("all")}</option>
              {taluks.map((d) => (
                <option key={d.id} value={d.id}>
                  {nameOf(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("taluk")} ({selectedTaluks.size})
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {taluks.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTaluks.has(v.id)}
                    onChange={() =>
                      flip(selectedTaluks, setSelectedTaluks, v.id)
                    }
                  />
                  {nameOf(v)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("village")} ({selected.size})
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {villages.length === 0 && (
                <p className="text-xs text-slate-400">{t("selectTaluk")}</p>
              )}
              {villages.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(v.id)}
                    onChange={() => flip(selected, setSelected, v.id)}
                  />
                  {nameOf(v)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
