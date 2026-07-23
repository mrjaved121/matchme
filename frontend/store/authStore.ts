import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  first_name: string | null;
  onboarding_completed: boolean;
  is_admin: boolean;
  status: string;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  initializing: boolean;
  setSession: (session: Session | null) => void;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initializing: true,
  setSession: (session) => set({ session }),
  refreshProfile: async () => {
    const session = get().session;
    if (!session) {
      set({ profile: null });
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, onboarding_completed, is_admin, status")
      .eq("id", session.user.id)
      .single();
    set({ profile: data ?? null });
  },
}));

// onAuthStateChange fires once immediately with the current session
// (event "INITIAL_SESSION"), so this single subscription covers both
// app-launch restoration and every subsequent sign-in/out/refresh.
supabase.auth.onAuthStateChange(async (_event, session) => {
  useAuthStore.getState().setSession(session);
  await useAuthStore.getState().refreshProfile();
  useAuthStore.setState({ initializing: false });
});
