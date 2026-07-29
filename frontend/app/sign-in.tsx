import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    router.push({ pathname: "/verify", params: { email: email.trim() } });
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>
            MatchMe
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            Real, timed chats — no endless swiping. Enter your email to get a one-time
            code.
          </Text>
        </View>

        <TextField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error}
        />

        <Button label="Continue" onPress={handleContinue} loading={loading} />

        <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>
          By continuing you agree to MatchMe's community guidelines, our{" "}
          <Text style={{ textDecorationLine: "underline" }} onPress={() => router.push("/legal/terms")}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={{ textDecorationLine: "underline" }} onPress={() => router.push("/legal/privacy")}>
            Privacy Policy
          </Text>
          . You must be 18+ to use MatchMe.
        </Text>
      </View>
    </ScreenContainer>
  );
}
