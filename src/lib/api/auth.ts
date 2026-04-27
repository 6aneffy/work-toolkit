import type { Session, User, AuthChangeEvent, Subscription } from "@supabase/supabase-js";
import { requireSupabase } from "../supabase/client";

export async function signInWithEmail(email: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw new Error(`[Supabase Auth] ${error.message}`);
}

export async function signOut(): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`[Supabase Auth] ${error.message}`);
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`[Supabase Auth] ${error.message}`);
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  const supabase = requireSupabase();
  const { data } = supabase.auth.onAuthStateChange(callback);
  const subscription: Subscription = data.subscription;
  return () => subscription.unsubscribe();
}
