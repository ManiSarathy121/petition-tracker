"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { Department, District, Profile, Taluk, Village } from "./types";

export interface MasterData {
  districts: District[];
  taluks: Taluk[];
  villages: Village[];
  departments: Department[];
  officers: Profile[];
  loading: boolean;
  reload: () => void;
}

export function useMasterData(): MasterData {
  const [districts, setDistricts] = useState<District[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [d, tk, v, dep, prof] = await Promise.all([
        supabase.from("districts").select("*").order("name_en"),
        supabase.from("taluks").select("*").order("name_en"),
        supabase.from("villages").select("*").order("name_en"),
        supabase.from("departments").select("*").order("name_en"),
        supabase.from("profiles").select("*").eq("app_name", "petition-tracker").order("full_name"),
      ]);
      if (cancelled) return;
      setDistricts((d.data as District[]) ?? []);
      setTaluks((tk.data as Taluk[]) ?? []);
      setVillages((v.data as Village[]) ?? []);
      setDepartments((dep.data as Department[]) ?? []);
      setOfficers((prof.data as Profile[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    districts,
    taluks,
    villages,
    departments,
    officers,
    loading,
    reload: () => setTick((n) => n + 1),
  };
}
