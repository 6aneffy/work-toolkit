import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getCurrentSession,
  onAuthStateChange,
  signInWithEmail as apiSignInWithEmail,
  signOut as apiSignOut,
} from "../lib/api/auth";
import { isSupabaseConfigured } from "../lib/supabase/client";

export type AuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const configured = isSupabaseConfigured();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getCurrentSession()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => {
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  const signInWithEmail = useCallback(
    async (email: string) => {
      if (!configured) {
        throw new Error("Supabase 환경변수가 설정되지 않아 로그인을 사용할 수 없습니다.");
      }
      await apiSignInWithEmail(email);
    },
    [configured]
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await apiSignOut();
  }, [configured]);

  return {
    configured,
    loading,
    session,
    user: session?.user ?? null,
    signInWithEmail,
    signOut,
  };
}
