import { FlatList, Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

export default function MyProfile() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const myId = useAuthStore((s) => s.session!.user.id);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["my-photos", myId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_photos")
        .select("storage_path, position")
        .eq("profile_id", myId)
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: theme.spacing.md,
        }}
      >
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Profile</Text>
        <Button label="Settings" variant="ghost" onPress={() => router.push("/(app)/settings")} />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.storage_path}
          numColumns={3}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.md }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: publicPhotoUrl(item.storage_path) }}
              style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: theme.radius.card }}
            />
          )}
        />
      )}

      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md }]}>
        {profile?.first_name}
      </Text>

      <Button
        label="Edit profile"
        variant="secondary"
        onPress={() => router.push("/(app)/profile/edit")}
        style={{ marginTop: theme.spacing.lg }}
      />
    </ScreenContainer>
  );
}
