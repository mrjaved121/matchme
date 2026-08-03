import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase";

const RESEND_COOLDOWN_SECONDS = 30;

export default function Verify() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleVerify() {
    if (code.trim().length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    // Auth state change listener updates the store; root index route
    // will redirect to onboarding or home automatically.
    router.replace("/");
  }

  async function handleResend() {
    setResending(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: "matchme://auth-callback" },
    });
    setResending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
            Check your email
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            We sent a code to {email}. Type it below, or just tap the "Sign in" link in that email — either one
            works.
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[theme.typography.caption, { color: theme.color.primary, fontWeight: "700" }]}>
              Wrong email? Change it
            </Text>
          </Pressable>
        </View>

        <TextField
          label="Verification code"
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          error={error}
        />

        <Button label="Verify" onPress={handleVerify} loading={loading} />
        <Button
          label={cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
          variant="ghost"
          onPress={handleResend}
          loading={resending}
          disabled={cooldown > 0}
        />
      </View>
    </ScreenContainer>
  );
}
