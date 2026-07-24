import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { supabase } from "./supabase";

// Requires an EAS project to be linked (`eas init`) before Expo can issue a
// push token — until then this resolves to null and is a no-op, so it's
// safe to call unconditionally on every app launch.
//
// expo-notifications must NOT be statically imported: since SDK 53, merely
// importing it throws in Expo Go on Android (remote push notifications were
// removed from Expo Go — see https://docs.expo.dev/develop/development-builds/introduction/).
// It's imported dynamically below, only once we've confirmed we're not
// running in Expo Go, so the module is never evaluated there.
export async function registerPushToken(profileId: string): Promise<void> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const Notifications = await import("expo-notifications");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;

  if (status !== "granted") {
    const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
    status = requestedStatus;
  }

  if (status !== "granted") return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!token) return;

  await supabase
    .from("push_tokens")
    .upsert(
      { profile_id: profileId, token, platform: Platform.OS === "ios" ? "ios" : "android" },
      { onConflict: "token" },
    );
}
