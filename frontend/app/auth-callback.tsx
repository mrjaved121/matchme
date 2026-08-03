import { useEffect } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { LoadingState } from "../components/StateViews";

const FALLBACK_TIMEOUT_MS = 10_000;

// Landing spot for the matchme://auth-callback link tapped from a magic-link
// email. The actual session handling happens in the root layout's Linking
// listener (it needs the raw URL including the #access_token fragment,
// which this screen's own route params wouldn't include) — this just gives
// the OS somewhere real to land while that resolves, and gets out of the
// way on its own if that resolution never arrives for some reason, so a
// bad/expired link can't strand someone on this spinner forever.
export default function AuthCallback() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/welcome"), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenContainer>
      <LoadingState label="Signing you in…" />
    </ScreenContainer>
  );
}
