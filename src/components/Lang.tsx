"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dict, t, type DictKey, type Lang } from "@/i18n/dict";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  other: (k: DictKey) => string;
}

const LangContext = createContext<Ctx>({
  lang: "ta",
  setLang: () => {},
  t: (k) => t(k, "ta"),
  other: (k) => t(k, "en"),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ta");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "en" || stored === "ta") setLangState(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* ignore */
    }
  };

  const value: Ctx = {
    lang,
    setLang,
    t: (k) => t(k, lang),
    other: (k) => t(k, lang === "ta" ? "en" : "ta"),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Bilingual label: primary language large, the other language small underneath. */
export function L({ k, className = "" }: { k: DictKey; className?: string }) {
  const { lang } = useLang();
  const primary = t(k, lang);
  const secondary = t(k, lang === "ta" ? "en" : "ta");
  return (
    <span className={className}>
      <span className={lang === "ta" ? "ta" : ""}>{primary}</span>
      {secondary !== primary && <span className="label-sub">{secondary}</span>}
    </span>
  );
}

/** Single-line bilingual text, e.g. "மனுக்கள் · Petitions" */
export function LInline({ k }: { k: DictKey }) {
  const { lang } = useLang();
  return <>{t(k, lang)}</>;
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex rounded-md border border-white/25 overflow-hidden text-xs">
      {(["ta", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 font-medium transition-colors ${
            lang === l
              ? "bg-white text-[color:var(--tn-maroon)]"
              : "text-white/80 hover:bg-white/10"
          }`}
        >
          {l === "ta" ? "தமிழ்" : "EN"}
        </button>
      ))}
    </div>
  );
}

/** Picks the right name field off a bilingual master-data row. */
export function useName() {
  const { lang } = useLang();
  return (
    row?: { name_en?: string | null; name_ta?: string | null } | null,
  ) => {
    if (!row) return "—";
    if (lang === "ta") return row.name_ta || row.name_en || "—";
    return row.name_en || row.name_ta || "—";
  };
}

export { dict };
