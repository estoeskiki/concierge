import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'kiosk' | 'store_manager' | 'mall_admin' | null;

export interface AuthState {
  session: Session | null;
  role: UserRole;
  mallId: string | null;
  storeId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

function extractMeta(session: Session | null) {
  const meta = session?.user?.app_metadata ?? {};
  return {
    role: (meta.user_role ?? null) as UserRole,
    mallId: (meta.mall_id ?? null) as string | null,
    storeId: (meta.store_id ?? null) as string | null,
  };
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { role, mallId, storeId } = extractMeta(session);

  return {
    session,
    role,
    mallId,
    storeId,
    loading,
    signOut: async () => { await supabase.auth.signOut(); },
  };
}
