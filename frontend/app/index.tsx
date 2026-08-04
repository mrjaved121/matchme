import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function RootIndex() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  if (!profile?.onboarding_completed) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(app)/discover" />;
}
