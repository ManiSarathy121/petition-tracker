"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMasterData } from "@/lib/useMasterData";
import { useLang, useName } from "./Lang";
import type { District, Taluk, Village } from "@/lib/types";

interface DistrictContextType {
  defaultDistrictId: string;
  setDefaultDistrictId: (id: string) => void;
  defaultTalukId: string;
  setDefaultTalukId: (id: string) => void;
  currentDistrict: District | null;
  currentTaluk: Taluk | null;
  districtTaluks: Taluk[];
  districtVillages: Village[];
}

const DistrictContext = createContext<DistrictContextType>({
  defaultDistrictId: "",
  setDefaultDistrictId: () => {},
  defaultTalukId: "",
  setDefaultTalukId: () => {},
  currentDistrict: null,
  currentTaluk: null,
  districtTaluks: [],
  districtVillages: [],
});

const STORAGE_DIST_KEY = "tn_default_district_id";
const STORAGE_TALUK_KEY = "tn_default_taluk_id";

export function DistrictProvider({ children }: { children: React.ReactNode }) {
  const master = useMasterData();
  const [defaultDistrictId, setDistrictIdState] = useState<string>("");
  const [defaultTalukId, setTalukIdState] = useState<string>("");

  useEffect(() => {
    const savedDist = localStorage.getItem(STORAGE_DIST_KEY);
    if (savedDist) setDistrictIdState(savedDist);

    const savedTaluk = localStorage.getItem(STORAGE_TALUK_KEY);
    if (savedTaluk) setTalukIdState(savedTaluk);
  }, []);

  // Auto-setup first time: Ranipet District + Nemili Taluk
  useEffect(() => {
    if (!defaultDistrictId && master.districts.length > 0) {
      const ranipet = master.districts.find(
        (d) => d.name_en.toLowerCase() === "ranipet" || d.code === "RNP"
      );
      const initialDistId = ranipet ? ranipet.id : master.districts[0].id;
      setDistrictIdState(initialDistId);
      localStorage.setItem(STORAGE_DIST_KEY, initialDistId);
    }
  }, [defaultDistrictId, master.districts]);

  useEffect(() => {
    if (defaultDistrictId && !defaultTalukId && master.taluks.length > 0) {
      const availableTaluks = master.taluks.filter((t) => t.district_id === defaultDistrictId);
      const nemili = availableTaluks.find((t) => t.name_en.toLowerCase() === "nemili");
      const initialTalukId = nemili ? nemili.id : (availableTaluks[0]?.id ?? "");
      if (initialTalukId) {
        setTalukIdState(initialTalukId);
        localStorage.setItem(STORAGE_TALUK_KEY, initialTalukId);
      }
    }
  }, [defaultDistrictId, defaultTalukId, master.taluks]);

  const setDefaultDistrictId = (id: string) => {
    setDistrictIdState(id);
    localStorage.setItem(STORAGE_DIST_KEY, id);
    
    // Auto-select first taluk under new district
    const available = master.taluks.filter((t) => t.district_id === id);
    const firstTaluk = available.find((t) => t.name_en.toLowerCase() === "nemili") ?? available[0];
    if (firstTaluk) {
      setTalukIdState(firstTaluk.id);
      localStorage.setItem(STORAGE_TALUK_KEY, firstTaluk.id);
    } else {
      setTalukIdState("");
      localStorage.removeItem(STORAGE_TALUK_KEY);
    }
  };

  const setDefaultTalukId = (id: string) => {
    setTalukIdState(id);
    localStorage.setItem(STORAGE_TALUK_KEY, id);
  };

  const currentDistrict =
    master.districts.find((d) => d.id === defaultDistrictId) ?? null;

  const currentTaluk =
    master.taluks.find((t) => t.id === defaultTalukId) ?? null;

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
        defaultTalukId,
        setDefaultTalukId,
        currentDistrict,
        currentTaluk,
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
  const { currentDistrict, currentTaluk, setDefaultDistrictId, setDefaultTalukId, districtTaluks } = useDefaultDistrict();
  const master = useMasterData();
  const name = useName();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"district" | "taluk">("district");
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

  const filteredTaluks = districtTaluks.filter((tk) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      tk.name_en.toLowerCase().includes(q) ||
      (tk.name_ta && tk.name_ta.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors"
        title="Click to set default District and Taluk"
      >
        <span className="text-amber-300">📍</span>
        <span className="font-medium truncate max-w-[170px]">
          {currentDistrict ? name(currentDistrict) : t("district")}
          {currentTaluk ? `, ${name(currentTaluk)}` : ""}
        </span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 w-64 rounded-md bg-white text-slate-800 shadow-xl ring-1 ring-black/10 p-2 space-y-2">
          <div className="flex border-b border-slate-100 pb-1.5 gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab("district"); setSearch(""); }}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                activeTab === "district" ? "bg-primary-50 text-primary-800 border border-primary-200" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              1. {t("district")}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("taluk"); setSearch(""); }}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                activeTab === "taluk" ? "bg-primary-50 text-primary-800 border border-primary-200" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              2. {t("taluk")}
            </button>
          </div>

          <input
            type="text"
            className="input mt-0 text-xs py-1 px-2"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {activeTab === "district" ? (
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
                        setActiveTab("taluk");
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
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredTaluks.length === 0 ? (
                <li className="p-2 text-slate-400">No taluk found</li>
              ) : (
                filteredTaluks.map((tk) => (
                  <li key={tk.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultTalukId(tk.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                        tk.id === currentTaluk?.id
                          ? "bg-amber-50 text-amber-900 font-semibold"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span>{name(tk)}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
