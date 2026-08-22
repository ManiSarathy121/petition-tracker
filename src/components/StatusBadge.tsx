"use client";

import { useLang } from "./Lang";
import {
  PRIORITY_STYLES,
  STATUS_STYLES,
  type PetitionStatus,
  type Priority,
} from "@/lib/types";
import type { DictKey } from "@/i18n/dict";

export function StatusBadge({ status }: { status: PetitionStatus }) {
  const { t } = useLang();
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {t(`status_${status}` as DictKey)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLang();
  if (priority === "low" || priority === "normal") return null;
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>
      {t(`priority_${priority}` as DictKey)}
    </span>
  );
}
