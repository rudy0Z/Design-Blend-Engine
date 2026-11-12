import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Official Supabase Auth + Postgres + Storage Client Wiring
 * (see docs/SUPABASE-BACKEND-HANDOFF.md & supabase/migrations/20261112000000_design_blend_v2.sql).
 *
 * Automatically activates when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are added to `artifacts/design-blend/.env.local`.
 */

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: { username: string; display_name: string },
) {
  if (!supabase) throw new Error("Supabase env vars are not configured yet.");
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

export async function signInWithSupabasePassword(email: string, password: string) {
  if (!supabase) throw new Error("Supabase env vars are not configured yet.");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithSupabaseOAuth(provider: "google" | "github") {
  if (!supabase) throw new Error("Supabase env vars are not configured yet.");
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

export async function signOutSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Uploads a user's reference image into the `user-references` Supabase Storage
 * bucket under `{userId}/{timestamp}-{filename}` and returns its public URL.
 * When running locally before Supabase keys are added, converts to a compact data URL.
 */
export async function uploadUserReferenceImage(file: File, userId?: string): Promise<string> {
  if (supabase && userId) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage
      .from("user-references")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("user-references").getPublicUrl(path);
    return data.publicUrl;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
