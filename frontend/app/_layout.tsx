import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/useTheme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { supabase } from "../lib/supabase";

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

  if (initializing) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(app)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
