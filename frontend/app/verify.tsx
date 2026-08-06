import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../components/ScreenContainer";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase";

const RESEND_COOLDOWN_SECONDS = 55;
const CODE_LENGTH = 6;

// Matches design/stitch_just_spark_ui_kit/otp_verification/code.html: a
// lock icon, headline, 6 individually-boxed auto-advancing digit inputs,
// and a countdown-gated resend link — adapted from "Verify your number"
// (phone) to email, since this app only ever sends codes by email.
export default function Verify() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      // Pasted or autofilled — spread across remaining boxes.
      const next = [...digits];
      for (let i = 0; i < clean.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = clean[i];
      }
      setDigits(next);
      const lastFilled = Math.min(index + clean.length, CODE_LENGTH - 1);
      inputRefs.current[lastFilled]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

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
      options: { shouldCreateUser: true, emailRedirectTo: "spark://auth-callback" },
    });
    setResending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  const minutes = Math.floor(cooldown / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (cooldown % 60).toString().padStart(2, "0");

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.lg }}>
        <View style={{ alignItems: "center", gap: theme.spacing.md, width: "100%" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.color.surfaceVariant,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-open-outline" size={30} color={theme.color.primary} />
          </View>
          <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <Text style={[theme.typography.displayLg, { fontSize: 28, lineHeight: 34, color: theme.color.textPrimary, textAlign: "center" }]}>
              Verify your email
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{email}</Text>
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[theme.typography.caption, { color: theme.color.primary, fontWeight: "700", marginTop: 4 }]}>
                Wrong email? Change it
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                value={digit}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={i === 0 ? CODE_LENGTH : 1}
                autoFocus={i === 0}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 12,
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: "700",
                  color: theme.color.textPrimary,
                  backgroundColor: theme.color.inputFill,
                }}
              />
            ))}
          </View>
          {error ? (
            <Text style={[theme.typography.caption, { color: theme.color.error, textAlign: "center" }]}>{error}</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>Didn't receive it?</Text>
            <Pressable onPress={handleResend} disabled={cooldown > 0 || resending}>
              <Text style={[theme.typography.label, { color: cooldown > 0 ? theme.color.textSecondary : theme.color.primary }]}>
                {cooldown > 0 ? `Resend in ${minutes}:${seconds}` : resending ? "Resending…" : "Resend Code"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Button label="Verify" onPress={handleVerify} loading={loading} fullWidth />
      </View>
    </ScreenContainer>
  );
}
