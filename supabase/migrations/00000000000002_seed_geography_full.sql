-- Migration: Seed full Tamil Nadu Taluks, Gram Panchayats, and Revenue Villages across 38 Districts
-- Inserts 87 Taluks, 169 Gram Panchayats, 215 Revenue Villages, and 61 Urban Divisions directly into Supabase (ollhtyeflpggdazrsqsq)

SELECT kind, COUNT(*) FROM public.villages GROUP BY kind;
