"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMasterData } from "@/lib/useMasterData";
import { useLang, useName } from "./Lang";
import type { District, Taluk, Village } from "@/lib/types";

interface DistrictContextType {
  defaultDistrictId: string;
  setDefaultDistrictId: (id: string) => void;
  currentDistrict: District | null;
  districtTaluks: Taluk[];
  districtVillages: Village[];
}

const DistrictContext = createContext<DistrictContextType>({
  defaultDistrictId: "",
  setDefaultDistrictId: () => {},
  currentDistrict: null,
  districtTaluks: [],
  districtVillages: [],
});

const STORAGE_KEY = "tn_default_district_id";

export function DistrictProvider({ children }: { children: React.ReactNode }) {
  const master = useMasterData();
  const [defaultDistrictId, setDistrictIdState] = useState<string>("");

  useEffect(() => {
    // 1. Try reading from LocalStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDistrictIdState(saved);
    }
  }, []);

  // First time auto-setup: default to Ranipet if not set
  useEffect(() => {
    if (!defaultDistrictId && master.districts.length > 0) {
      const ranipet = master.districts.find(
        (d) => d.name_en.toLowerCase() === "ranipet" || d.code === "RNP"
      );
      const initialId = ranipet ? ranipet.id : master.districts[0].id;
      setDistrictIdState(initialId);
      localStorage.setItem(STORAGE_KEY, initialId);
    }
  }, [defaultDistrictId, master.districts]);

  const setDefaultDistrictId = (id: string) => {
    setDistrictIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const currentDistrict =
    master.districts.find((d) => d.id === defaultDistrictId) ?? null;

  const districtTaluks = master.taluks.filter(
    (t) => t.district_id === defaultDistrictId
  );

  const talukIds = new Set(districtTaluks.map((t) => t.id));
  const districtVillages = master.villages.filter((v) =>
    talukIds.has(v.taluk_id)
  );

  return (
    <DistrictContext.Provider
      value={{
        defaultDistrictId,
        setDefaultDistrictId,
        currentDistrict,
        districtTaluks,
        districtVillages,
      }}
    >
      {children}
    </DistrictContext.Provider>
  );
}

export function useDefaultDistrict() {
  return useContext(DistrictContext);
}

export function DistrictHeaderSelector() {
  const { currentDistrict, setDefaultDistrictId } = useDefaultDistrict();
  const master = useMasterData();
  const name = useName();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDistricts = master.districts.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      d.name_en.toLowerCase().includes(q) ||
      (d.name_ta && d.name_ta.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors"
        title="Click to set default district"
      >
        <span className="text-amber-300">📍</span>
        <span className="font-medium truncate max-w-[120px]">
          {currentDistrict ? name(currentDistrict) : t("district")}
        </span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 w-56 rounded-md bg-white text-slate-800 shadow-xl ring-1 ring-black/10 p-2 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 px-1 border-b border-slate-100 pb-1">
            Default District Preference
          </div>

          <input
            type="text"
            className="input mt-0 text-xs py-1 px-2"
            placeholder="Search district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredDistricts.length === 0 ? (
              <li className="p-2 text-slate-400">No district found</li>
            ) : (
              filteredDistricts.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultDistrictId(d.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                      d.id === currentDistrict?.id
                        ? "bg-amber-50 text-amber-900 font-semibold"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span>{name(d)}</span>
                    {d.code && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {d.code}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
