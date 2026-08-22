/**
 * Supabase connection details.
 *
 * The anon/publishable key is designed to be shipped to the browser — every
 * table is protected by row level security, so it grants nothing on its own.
 * Values here are fallbacks; set NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment to point at another project.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ollhtyeflpggdazrsqsq.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_vXtlD6VqEY8u_tBSdmw-0A_hxEIlf2j";
