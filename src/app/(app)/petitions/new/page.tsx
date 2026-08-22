"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { L, useLang, useName } from "@/components/Lang";
import { useIsAdmin } from "@/components/ProfileContext";
import { useMasterData } from "@/lib/useMasterData";
import { PRIORITIES, STATUSES } from "@/lib/types";
import type { DictKey } from "@/i18n/dict";
import { TamilInput } from "@/components/TamilInput";
import { useDefaultDistrict } from "@/components/DistrictContext";
import { PetitionScanner, type ExtractedPetitionData } from "@/components/PetitionScanner";

const empty = {
  proceedings_no: "",
  received_date: new Date().toISOString().slice(0, 10),
  subject: "",
  description: "",
  writer_name: "",
  outward_no: "",
  outward_date: "",
  next_action_date: "",
  register_remarks: "",
  petitioner_name: "",
  petitioner_father: "",
  petitioner_phone: "",
  petitioner_address: "",
  district_id: "",
  taluk_id: "",
  village_id: "",
  department_id: "",
  assigned_to: "",
  priority: "normal",
  status: "new",
};

export default function NewPetitionPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const name = useName();
  const isAdmin = useIsAdmin();
  const master = useMasterData();
  const { defaultDistrictId, defaultTalukId } = useDefaultDistrict();

  const [form, setForm] = useState({
    ...empty,
    district_id: defaultDistrictId,
    taluk_id: defaultTalukId,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Sync default location preferences if form hasn't been touched yet
  useEffect(() => {
    setForm((f) => ({
      ...f,
      district_id: f.district_id || defaultDistrictId,
      taluk_id: f.taluk_id || defaultTalukId,
    }));
  }, [defaultDistrictId, defaultTalukId]);

  const handleScannerExtracted = (extracted: ExtractedPetitionData) => {
    setForm((f) => ({
      ...f,
      petitioner_name: extracted.petitioner_name || f.petitioner_name,
      petitioner_phone: extracted.petitioner_phone || f.petitioner_phone,
      subject: extracted.subject || f.subject,
      petitioner_address: extracted.petitioner_address || f.petitioner_address,
      description: extracted.description || f.description,
    }));
    setScanMessage(t("scanSuccess"));
    setTimeout(() => setScanMessage(null), 5000);
  };

  if (!isAdmin) {
    return <p className="card p-6 text-sm text-slate-600">{t("adminOnly")}</p>;
  }

  const set = (k: keyof typeof empty, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = {
      ...form,
      created_by: userRes.user?.id,
    };
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }
    if (form.assigned_to) {
      payload.assigned_at = new Date().toISOString();
      if (form.status === "new") payload.status = "assigned";
    }
    const { data, error } = await supabase
      .from("petitions")
      .insert(payload)
      .select()
      .single();
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    for (const file of files) {
      const path = `${data.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await supabase.storage
        .from("petition-files")
        .upload(path, file);
      if (!up.error) {
        await supabase.from("petition_attachments").insert({
          petition_id: data.id,
          kind: "petition_copy",
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: userRes.user?.id,
        });
      }
    }
    router.push(`/petitions/${data.id}`);
  };

  const talukOptions = master.taluks.filter(
    (x) => !form.district_id || x.district_id === form.district_id,
  );
  const villageOptions = master.villages.filter(
    (x) => !form.taluk_id || x.taluk_id === form.taluk_id,
  );
  const officerOptions = master.officers.filter(
    (o) =>
      o.is_active &&
      (!form.department_id || o.department_id === form.department_id),
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}>
            {t("newPetition")}
          </h1>
          <span className="text-xs text-slate-400">{t("formRef")}</span>
        </div>

        <div className="flex items-center gap-2">
          <PetitionScanner onDataExtracted={handleScannerExtracted} />
        </div>
      </div>

      {scanMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span>✅ {scanMessage}</span>
          <button type="button" onClick={() => setScanMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}
      {/* Register entry — columns 1-4 of the book */}
      <section className="card p-5">
        <h2 className="section-title">
          <L k="registerDetails" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            k="proceedingsNo"
            value={form.proceedings_no}
            onChange={(v) => set("proceedings_no", v)}
          />
          <Input
            k="receivedDate"
            type="date"
            required
            value={form.received_date}
            onChange={(v) => set("received_date", v)}
          />
          <div>
            <label className="label">
              <L k="writerName" />
            </label>
            <TamilInput
              value={form.writer_name}
              onChange={(v) => set("writer_name", v)}
            />
          </div>
          <Input
            k="outwardNo"
            value={form.outward_no}
            onChange={(v) => set("outward_no", v)}
          />
          <Input
            k="outwardDate"
            type="date"
            value={form.outward_date}
            onChange={(v) => set("outward_date", v)}
          />
          <Input
            k="nextActionDate"
            type="date"
            value={form.next_action_date}
            onChange={(v) => set("next_action_date", v)}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">
              <L k="subject" /> <span className="text-rose-600">*</span>
            </label>
            <TamilInput
              required
              value={form.subject}
              onChange={(v) => set("subject", v)}
              placeholder="e.g. Ocheri Road Repair Petition / ஓச்சரி சாலை சீரமைப்பு மனு"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              k="description"
              rows={4}
              value={form.description}
              onChange={(v) => set("description", v)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              k="registerRemarks"
              rows={2}
              value={form.register_remarks}
              onChange={(v) => set("register_remarks", v)}
            />
          </div>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="section-title">
          <L k="petitionerDetails" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">
              <L k="petitionerName" /> <span className="text-rose-600">*</span>
            </label>
            <TamilInput
              required
              value={form.petitioner_name}
              onChange={(v) => set("petitioner_name", v)}
              placeholder="e.g. Mani / மணி"
            />
          </div>
          <div>
            <label className="label">
              <L k="petitionerFather" />
            </label>
            <TamilInput
              value={form.petitioner_father}
              onChange={(v) => set("petitioner_father", v)}
              placeholder="e.g. Sarathy / சாரதி"
            />
          </div>
          <Input
            k="petitionerPhone"
            value={form.petitioner_phone}
            onChange={(v) => set("petitioner_phone", v)}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">
              <L k="petitionerAddress" />
            </label>
            <TamilInput
              isTextArea
              rows={2}
              value={form.petitioner_address}
              onChange={(v) => set("petitioner_address", v)}
              placeholder="e.g. Ocheri Village, Nemili Taluk..."
            />
          </div>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="section-title">
          <L k="locationDetails" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            k="district"
            value={form.district_id}
            onChange={(v) => {
              set("district_id", v);
              set("taluk_id", "");
              set("village_id", "");
            }}
            options={master.districts.map((d) => ({
              id: d.id,
              label: name(d),
            }))}
          />
          <Select
            k="taluk"
            value={form.taluk_id}
            onChange={(v) => {
              set("taluk_id", v);
              set("village_id", "");
            }}
            options={talukOptions.map((d) => ({ id: d.id, label: name(d) }))}
          />
          <Select
            k="village"
            value={form.village_id}
            onChange={(v) => set("village_id", v)}
            options={villageOptions.map((d) => ({ id: d.id, label: name(d) }))}
          />
        </div>
      </section>
      <section className="card p-5">
        <h2 className="section-title">
          <L k="routingDetails" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            k="department"
            value={form.department_id}
            onChange={(v) => {
              set("department_id", v);
              set("assigned_to", "");
            }}
            options={master.departments.map((d) => ({
              id: d.id,
              label: name(d),
            }))}
          />
          <Select
            k="assignedTo"
            value={form.assigned_to}
            onChange={(v) => set("assigned_to", v)}
            options={officerOptions.map((o) => ({
              id: o.id,
              label: `${o.full_name}${o.designation ? " · " + o.designation : ""}`,
            }))}
          />
          <div>
            <label className="label">
              <L k="priority" />
            </label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`priority_${p}` as DictKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <L k="status" />
            </label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status_${s}` as DictKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="section-title">
          <L k="attachments" />
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          PDF / JPG / PNG · {t("optional")} · max 15 MB
        </p>
        <input
          type="file"
          multiple
          accept="application/pdf,image/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0
          file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium
          hover:file:bg-slate-200"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {files.map((f) => (
              <li key={f.name}>
                • {f.name} ({Math.round(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        )}
      </section>
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? t("saving") : t("createPetition")}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
function Input({
  k,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  k: DictKey;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">
        <L k={k} />
      </label>
      <input
        type={type}
        required={required}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Textarea({
  k,
  value,
  onChange,
  rows = 3,
}: {
  k: DictKey;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="label">
        <L k={k} />
      </label>
      <textarea
        rows={rows}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Select({
  k,
  value,
  onChange,
  options,
}: {
  k: DictKey;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  const { t } = useLang();
  return (
    <div>
      <label className="label">
        <L k={k} />
      </label>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— {t("all")} —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
