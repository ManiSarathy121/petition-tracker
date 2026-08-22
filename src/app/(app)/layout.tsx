import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/Shell";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium text-slate-800">
            No profile is linked to this account.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            இந்த கணக்குடன் சுயவிவரம் இணைக்கப்படவில்லை. நிர்வாகியை தொடர்பு
            கொள்ளவும்.
          </p>
        </div>
      </div>
    );
  }

  return <Shell profile={profile as Profile}>{children}</Shell>;
}
