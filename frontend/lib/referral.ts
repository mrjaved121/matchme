import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const PENDING_CODE_KEY = "spark_pending_referral_code";

export async function storePendingReferralCode(code: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_CODE_KEY, code.trim().toUpperCase());
}

/** Called once a profile row definitely exists (first onboarding step).
 * No-ops if there's no stored code, the code doesn't resolve, or the user
 * is somehow referring themselves. Safe to call every time — it clears the
 * stored code after the first successful attempt either way. */
export async function applyPendingReferralCode(myId: string): Promise<void> {
  const code = await AsyncStorage.getItem(PENDING_CODE_KEY);
  if (!code) return;
  await AsyncStorage.removeItem(PENDING_CODE_KEY);

  const { data: existing } = await supabase.from("profiles").select("referred_by").eq("id", myId).single();
  if (existing?.referred_by) return;

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referrer || referrer.id === myId) return;

  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", myId);
}

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function ensureReferralCode(myId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("referral_code").eq("id", myId).single();
  if (data?.referral_code) return data.referral_code;

  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = randomCode();
    const { error } = await supabase.from("profiles").update({ referral_code: candidate }).eq("id", myId);
    if (!error) return candidate;
  }
  throw new Error("Couldn't generate a referral code — try again.");
}

export type ReferredFriend = {
  id: string;
  first_name: string | null;
  onboarding_completed: boolean;
};

export async function fetchReferralHistory(myId: string): Promise<ReferredFriend[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, onboarding_completed")
    .eq("referred_by", myId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
