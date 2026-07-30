import { useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingState } from "../../components/StateViews";
import { useAuthStore } from "../../store/authStore";
import { resolveOnboardingStep } from "../../lib/onboardingProgress";

export default function OnboardingEntry() {
  const userId = useAuthStore((s) => s.session!.user.id);

  useEffect(() => {
    let cancelled = false;
    resolveOnboardingStep(userId).then((step) => {
      if (!cancelled) router.replace(step);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <ScreenContainer>
      <LoadingState />
    </ScreenContainer>
  );
}
