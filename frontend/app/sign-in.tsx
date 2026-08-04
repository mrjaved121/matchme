import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

// Matches design/stitch_just_spark_ui_kit/login/code.html ("Welcome back")
// and sign_up/code.html ("Find Your Spark"). Both exports show an
// email+password form — this app only ever had email+OTP (no password
// exists anywhere in the backend), so the password field is dropped and the
// submit button sends a one-time code instead. Sign-up's age/terms
// checkboxes are real and required, replacing the old passive disclaimer
// text; social buttons are the sign_up export's full-width labeled style
// for both modes, since the login export's icon-only variant only reduces
// consistency for no real benefit here.
export default function SignIn() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const canSubmit = isLogin || (ageConfirmed && agreedToTerms);

  async function handleContinue() {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!canSubmit) {
      setError("Please confirm both checkboxes to continue.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: "spark://auth-callback" },
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
        <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
          {isLogin ? (
            <Ionicons name="heart" size={44} color={theme.color.primary} />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: theme.color.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="heart" size={30} color={theme.color.primary} />
            </View>
          )}
          <Text style={[theme.typography.displayLg, { fontSize: 28, lineHeight: 34, color: theme.color.textPrimary, textAlign: "center", marginTop: theme.spacing.xs }]}>
            {isLogin ? "Welcome back" : "Find Your Spark"}
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
            {isLogin
              ? "We're so glad to see you. Let's get you back to connecting."
              : "Join today and start building kind connections."}
          </Text>
        </View>

        <TextField
          label="Email"
          leadingIcon="mail-outline"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error}
        />

        {!isLogin ? (
          <View style={{ gap: theme.spacing.sm, backgroundColor: theme.color.inputFill, borderRadius: 20, padding: theme.spacing.md }}>
            <CheckboxRow checked={ageConfirmed} onToggle={() => setAgeConfirmed((v) => !v)}>
              I confirm that I am 18 years of age or older.
            </CheckboxRow>
            <CheckboxRow checked={agreedToTerms} onToggle={() => setAgreedToTerms((v) => !v)}>
              I agree to the{" "}
              <Text style={{ color: theme.color.primary, fontWeight: "700" }} onPress={() => router.push("/legal/terms")}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text style={{ color: theme.color.primary, fontWeight: "700" }} onPress={() => router.push("/legal/privacy")}>
                Privacy Policy
              </Text>
              .
            </CheckboxRow>
          </View>
        ) : null}

        <Button
          label={isLogin ? "Log in" : "Create account"}
          onPress={handleContinue}
          loading={loading}
          disabled={!isLogin && !canSubmit}
          fullWidth
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textTransform: "uppercase" }]}>
            {isLogin ? "Or continue with" : "or sign up with"}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
        </View>

        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <SocialButton label="Google" icon="logo-google" onPress={() => notConfigured("Google")} />
          <SocialButton label="Apple" icon="logo-apple" onPress={() => notConfigured("Apple")} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            {isLogin ? "New here? " : "Already have an account? "}
          </Text>
          <Pressable onPress={() => router.setParams({ mode: isLogin ? "signup" : "login" })}>
            <Text style={[theme.typography.label, { color: theme.color.primary }]}>{isLogin ? "Sign up" : "Log in"}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function CheckboxRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onToggle} style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.sm }}>
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 2,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? theme.color.primary : theme.color.border,
          backgroundColor: checked ? theme.color.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, flex: 1 }]}>{children}</Text>
    </Pressable>
  );
}

function SocialButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.xs,
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: theme.color.inputFill,
      }}
    >
      <Ionicons name={icon} size={18} color={theme.color.textPrimary} />
      <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}
