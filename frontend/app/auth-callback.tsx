import { ScreenContainer } from "../components/ScreenContainer";
import { LoadingState } from "../components/StateViews";

// Landing spot for the matchme://auth-callback link tapped from a magic-link
// email. The actual session handling happens in the root layout's Linking
// listener (it needs the raw URL including the #access_token fragment,
// which this screen's own route params wouldn't include) — this just gives
// the OS somewhere real to land while that resolves.
export default function AuthCallback() {
  return (
    <ScreenContainer>
      <LoadingState label="Signing you in…" />
    </ScreenContainer>
  );
}
