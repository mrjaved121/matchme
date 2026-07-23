import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Requires an EAS project to be linked (`eas init`) before Expo can issue a
// push token — until then this resolves to null and is a no-op, so it's
// safe to call unconditionally on every app launch.
export async function registerPushToken(profileId: string): Promise<void> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

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
