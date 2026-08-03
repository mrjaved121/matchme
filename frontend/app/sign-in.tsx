import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function notConfigured(provider: string) {
  Alert.alert(
    `${provider} sign-in isn't set up yet`,
    `${provider} requires developer credentials that haven't been configured for this app yet. Use email to continue for now.`,
  );
}

export default function SignIn() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isLogin = mode === "login";
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
            {isLogin ? "Log in" : "Create account"}
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            {isLogin
              ? "Enter your email and we'll send you a one-time code."
              : "Real, timed chats — no endless swiping. Enter your email to get a one-time code."}
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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <SocialButton label="Continue with Apple" icon="" onPress={() => notConfigured("Apple")} />
          <SocialButton label="Continue with Google" icon="G" onPress={() => notConfigured("Google")} />
          <SocialButton label="Continue with Phone" icon="☎" onPress={() => notConfigured("Phone")} />
        </View>

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

function SocialButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 52,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.color.border,
        backgroundColor: theme.color.surface,
      }}
    >
      <Text style={{ fontSize: 16, color: theme.color.textPrimary, fontWeight: "700" }}>{icon}</Text>
      <Text style={[theme.typography.button, { color: theme.color.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}
