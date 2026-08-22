"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { L, useLang, useName } from "@/components/Lang";
import { useIsAdmin, useProfile } from "@/components/ProfileContext";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { useMasterData } from "@/lib/useMasterData";
import {
  PRIORITIES,
  STATUSES,
  type Attachment,
  type Petition,
  type PetitionStatus,
  type Profile,
  type StatusHistory,
} from "@/lib/types";
import type { DictKey } from "@/i18n/dict";
export default function PetitionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, lang } = useLang();
  const name = useName();
  const isAdmin = useIsAdmin();
  const me = useProfile();
  const master = useMasterData();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const supabase = createClient();
    const [p, h, a] = await Promise.all([
      supabase.from("petitions").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("petition_status_history")
        .select("*")
        .eq("petition_id", id)
        .order("changed_at", { ascending: false }),
      supabase
        .from("petition_attachments")
        .select("*")
        .eq("petition_id", id)
        .order("uploaded_at", { ascending: false }),
    ]);
    setPetition((p.data as Petition) ?? null);
    setHistory((h.data as StatusHistory[]) ?? []);
    setFiles((a.data as Attachment[]) ?? []);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  if (loading)
    return <p className="card p-6 text-sm text-slate-500">{t("loading")}</p>;
  if (!petition)
    return (
      <div className="card p-6">
        <p className="text-sm text-slate-600">{t("noResults")}</p>
        <Link
          href="/petitions"
          className="mt-3 inline-block text-sm text-[color:var(--tn-maroon)] hover:underline"
        >
          ← {t("petitions")}
        </Link>
      </div>
    );
  const p = petition;
  const officerName = (uid: string | null) =>
    master.officers.find((o) => o.id === uid)?.full_name ?? "—";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/petitions"
            className="text-xs text-slate-500 hover:underline"
          >
            ← {t("petitions")}
          </Link>
          <h1
            className={`mt-1 text-xl font-semibold ${lang === "ta" ? "ta" : ""}`}
          >
            {p.subject}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{p.petition_no}</span>
            <span>·</span>
            <span>
              {t("serialNo")}: {p.serial_no}
            </span>
            <span>·</span>
            <span>
              {t("receivedDate")}: {p.received_date}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={p.status} />
          <PriorityBadge priority={p.priority} />
        </div>
      </div>
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-5">
            <h2 className="section-title">
              <L k="registerDetails" />
            </h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row k="proceedingsNo" v={p.proceedings_no} />
              <Row k="writerName" v={p.writer_name} />
              <Row k="outwardNo" v={p.outward_no} />
              <Row k="outwardDate" v={p.outward_date} />
              <Row k="actionTakenDate" v={p.action_taken_date} />
              <Row k="nextActionDate" v={p.next_action_date} />
              <div className="sm:col-span-2">
                <Row k="description" v={p.description} wrap />
              </div>
              <div className="sm:col-span-2">
                <Row k="registerRemarks" v={p.register_remarks} wrap />
              </div>
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="section-title">
              <L k="petitionerDetails" />
            </h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row k="petitionerName" v={p.petitioner_name} />
              <Row k="petitionerFather" v={p.petitioner_father} />
              <Row k="petitionerPhone" v={p.petitioner_phone} />
              <Row
                k="village"
                v={name(master.villages.find((v) => v.id === p.village_id))}
              />
              <Row
                k="taluk"
                v={name(master.taluks.find((v) => v.id === p.taluk_id))}
              />
              <Row
                k="district"
                v={name(master.districts.find((v) => v.id === p.district_id))}
              />
              <div className="sm:col-span-2">
                <Row k="petitionerAddress" v={p.petitioner_address} wrap />
              </div>
            </dl>
          </section>
          <Attachments
            petitionId={p.id}
            files={files}
            onChange={load}
            meId={me.id}
            isAdmin={isAdmin}
          />
          <section className="card p-5">
            <h2 className="section-title">
              <L k="history" />
            </h2>
            <ol className="space-y-4">
              {history.map((h) => (
                <li key={h.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--tn-maroon)]" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StatusBadge status={h.to_status} />
                    <span>{new Date(h.changed_at).toLocaleString()}</span>
                    <span>· {officerName(h.changed_by)}</span>
                  </div>
                  {h.comment && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {h.comment}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="space-y-5">
          <UpdatePanel petition={p} onDone={load} onError={setError} />
          <section className="card p-5">
            <h2 className="section-title">
              <L k="routingDetails" />
            </h2>
            <dl className="space-y-3">
              <Row
                k="department"
                v={name(
                  master.departments.find((d) => d.id === p.department_id),
                )}
              />
              <Row k="assignedTo" v={officerName(p.assigned_to)} />
            </dl>
            {isAdmin && (
              <AdminAssign
                petition={p}
                officers={master.officers}
                departments={master.departments.map((d) => ({
                  id: d.id,
                  label: name(d),
                }))}
                onDone={load}
                onError={setError}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
function Row({
  k,
  v,
  wrap = false,
}: {
  k: DictKey;
  v?: string | null;
  wrap?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <L k={k} />
      </dt>
      <dd
        className={`text-sm text-slate-800 ${wrap ? "whitespace-pre-wrap" : ""}`}
      >
        {v || "—"}
      </dd>
    </div>
  );
}
function UpdatePanel({
  petition,
  onDone,
  onError,
}: {
  petition: Petition;
  onDone: () => void;
  onError: (m: string | null) => void;
}) {
  const { t } = useLang();
  const [status, setStatus] = useState<PetitionStatus>(petition.status);
  const [comment, setComment] = useState("");
  const [next, setNext] = useState(petition.next_action_date ?? "");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    onError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_petition_status", {
      p_petition_id: petition.id,
      p_status: status,
      p_comment: comment || null,
      p_next_action: next || null,
    });
    setBusy(false);
    if (error) return onError(error.message);
    setComment("");
    onDone();
  };
  const commentOnly = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    onError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("add_petition_comment", {
      p_petition_id: petition.id,
      p_comment: comment,
    });
    setBusy(false);
    if (error) return onError(error.message);
    setComment("");
    onDone();
  };
  return (
    <section className="card p-5">
      <h2 className="section-title">
        <L k="updateStatus" />
      </h2>
      <div className="space-y-3">
        <div>
          <label className="label">
            <L k="status" />
          </label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as PetitionStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}` as DictKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">
            <L k="nextActionDate" />
          </label>
          <input
            type="date"
            className="input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            <L k="comment" />
          </label>
          <textarea
            rows={4}
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="btn-primary w-full"
            onClick={submit}
            disabled={busy}
          >
            {busy ? t("saving") : t("update")}
          </button>
          <button
            className="btn-secondary w-full"
            onClick={commentOnly}
            disabled={busy || !comment.trim()}
          >
            {t("addComment")}
          </button>
        </div>
      </div>
    </section>
  );
}
function AdminAssign({
  petition,
  officers,
  departments,
  onDone,
  onError,
}: {
  petition: Petition;
  officers: Profile[];
  departments: { id: string; label: string }[];
  onDone: () => void;
  onError: (m: string | null) => void;
}) {
  const { t } = useLang();
  const [dept, setDept] = useState(petition.department_id ?? "");
  const [officer, setOfficer] = useState(petition.assigned_to ?? "");
  const [priority, setPriority] = useState(petition.priority);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    onError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("petitions")
      .update({
        department_id: dept || null,
        assigned_to: officer || null,
        assigned_at: officer ? new Date().toISOString() : null,
        priority,
        status:
          officer && petition.status === "new" ? "assigned" : petition.status,
      })
      .eq("id", petition.id);
    setBusy(false);
    if (error) return onError(error.message);
    onDone();
  };
  const list = officers.filter(
    (o) => o.is_active && (!dept || o.department_id === dept),
  );
  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <div>
        <label className="label">
          <L k="department" />
        </label>
        <select
          className="input"
          value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setOfficer("");
          }}
        >
          <option value="">—</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">
          <L k="assignedTo" />
        </label>
        <select
          className="input"
          value={officer}
          onChange={(e) => setOfficer(e.target.value)}
        >
          <option value="">—</option>
          {list.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">
          <L k="priority" />
        </label>
        <select
          className="input"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Petition["priority"])}
        >
          {PRIORITIES.map((x) => (
            <option key={x} value={x}>
              {t(`priority_${x}` as DictKey)}
            </option>
          ))}
        </select>
      </div>
      <button className="btn-secondary w-full" onClick={save} disabled={busy}>
        {busy ? t("saving") : t("save")}
      </button>
    </div>
  );
}
function Attachments({
  petitionId,
  files,
  onChange,
  meId,
  isAdmin,
}: {
  petitionId: string;
  files: Attachment[];
  onChange: () => void;
  meId: string;
  isAdmin: boolean;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    const supabase = createClient();
    for (const file of Array.from(list)) {
      const path = `${petitionId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await supabase.storage
        .from("petition-files")
        .upload(path, file);
      if (!up.error) {
        await supabase.from("petition_attachments").insert({
          petition_id: petitionId,
          kind: "action_proof",
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: meId,
        });
      }
    }
    setBusy(false);
    onChange();
  };
  const open = async (a: Attachment) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("petition-files")
      .createSignedUrl(a.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const remove = async (a: Attachment) => {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.storage.from("petition-files").remove([a.file_path]);
    await supabase.from("petition_attachments").delete().eq("id", a.id);
    onChange();
  };
  return (
    <section className="card p-5">
      <h2 className="section-title">
        <L k="attachments" />
      </h2>
      {files.length === 0 && <p className="mb-3 text-sm text-slate-500">—</p>}
      <ul className="mb-4 space-y-2">
        {files.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
          >
            <span className="text-slate-400">
              {a.mime_type?.includes("pdf") ? "📄" : "🖼"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {a.file_name}
            </span>
            <span className="text-xs text-slate-400">
              {a.size_bytes ? Math.round(a.size_bytes / 1024) + " KB" : ""}
            </span>
            <button
              className="text-xs text-[color:var(--tn-maroon)] hover:underline"
              onClick={() => open(a)}
            >
              {t("download")}
            </button>
            {(isAdmin || a.uploaded_by === meId) && (
              <button
                className="text-xs text-rose-600 hover:underline"
                onClick={() => remove(a)}
              >
                {t("delete")}
              </button>
            )}
          </li>
        ))}
      </ul>
      <input
        type="file"
        multiple
        accept="application/pdf,image/*"
        disabled={busy}
        onChange={(e) => upload(e.target.files)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0
         file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
      />
      {busy && <p className="mt-2 text-xs text-slate-500">{t("uploading")}</p>}
    </section>
  );
}
