export type Role = "admin" | "officer";

export type PetitionStatus =
  "new" | "assigned" | "in_progress" | "resolved" | "rejected";

export type Priority = "low" | "normal" | "high" | "urgent";

export type VillageKind =
  "village" | "division" | "ward" | "panchayat" | "municipality";

export interface District {
  id: string;
  code: string | null;
  name_en: string;
  name_ta: string | null;
  is_active: boolean;
}

export interface Taluk {
  id: string;
  district_id: string;
  code: string | null;
  name_en: string;
  name_ta: string | null;
  is_active: boolean;
}

export interface Village {
  id: string;
  taluk_id: string;
  code: string | null;
  name_en: string;
  name_ta: string | null;
  kind: VillageKind;
  is_active: boolean;
}

export interface Department {
  id: string;
  code: string | null;
  name_en: string;
  name_ta: string | null;
  description: string | null;
  is_active: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  full_name_ta: string | null;
  email: string;
  phone: string | null;
  role: Role;
  department_id: string | null;
  designation: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Petition {
  id: string;
  petition_no: string | null;
  serial_no: number | null;
  proceedings_no: string | null;
  received_date: string;
  subject: string;
  description: string | null;
  writer_name: string | null;
  outward_no: string | null;
  outward_date: string | null;
  action_taken_date: string | null;
  next_action_date: string | null;
  register_remarks: string | null;
  petitioner_name: string;
  petitioner_father: string | null;
  petitioner_phone: string | null;
  petitioner_address: string | null;
  district_id: string | null;
  taluk_id: string | null;
  village_id: string | null;
  department_id: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  status: PetitionStatus;
  priority: Priority;
  closed_at: string | null;
  closing_remark: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: string;
  petition_id: string;
  from_status: PetitionStatus | null;
  to_status: PetitionStatus;
  comment: string | null;
  department_id: string | null;
  assigned_to: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface Attachment {
  id: string;
  petition_id: string;
  kind: "petition_copy" | "action_proof" | "other";
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export const STATUSES: PetitionStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export const STATUS_STYLES: Record<PetitionStatus, string> = {
  new: "bg-sky-100 text-sky-800 ring-sky-600/20",
  assigned: "bg-violet-100 text-violet-800 ring-violet-600/20",
  in_progress: "bg-amber-100 text-amber-800 ring-amber-600/20",
  resolved: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  rejected: "bg-rose-100 text-rose-800 ring-rose-600/20",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-500/20",
  normal: "bg-slate-100 text-slate-700 ring-slate-500/20",
  high: "bg-orange-100 text-orange-800 ring-orange-600/20",
  urgent: "bg-red-100 text-red-800 ring-red-600/20",
};
