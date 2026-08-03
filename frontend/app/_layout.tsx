import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack, router } from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/useTheme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { supabase } from "../lib/supabase";
import { handleAuthDeepLink } from "../lib/authDeepLink";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const initializing = useAuthStore((s) => s.initializing);
  const userId = useAuthStore((s) => s.session?.user.id);
  const theme = useTheme();

  useEffect(() => {
    if (!initializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [initializing]);

  useEffect(() => {
    if (!userId) return;

    const touch = () => {
      supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId).then();
    };

    touch();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") touch();
    });
    return () => subscription.remove();
  }, [userId]);

  useEffect(() => {
    async function tryUrl(url: string | null) {
      if (!url || !url.includes("auth-callback")) return;
      const handled = await handleAuthDeepLink(url);
      // Whether it succeeded or the link was expired/invalid, always leave
      // auth-callback's "Signing you in…" screen — a failed attempt must
      // never strand the user on an infinite spinner with no way out.
      router.replace(handled ? "/" : "/welcome");
    }

    Linking.getInitialURL().then(tryUrl);
    const subscription = Linking.addEventListener("url", (e) => tryUrl(e.url));
    return () => subscription.remove();
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="intro" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="verify" />
              <Stack.Screen name="auth-callback" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="account-created" />
              <Stack.Screen name="permissions-location" />
              <Stack.Screen name="permissions-notifications" />
              <Stack.Screen name="(app)" />
            </Stack>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
