import { FlatList, Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { Tag } from "../../../components/Tag";
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

  const { data: interestTags } = useQuery({
    queryKey: ["my-interest-tags", myId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("interest_tags").eq("id", myId).single();
      return data?.interest_tags ?? [];
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

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
          {profile?.first_name}
        </Text>
        {profile?.is_verified ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: theme.color.success + "22",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
            }}
          >
            <Text style={{ color: theme.color.success, fontWeight: "700", fontSize: 12 }}>✓ Verified</Text>
          </View>
        ) : null}
      </View>

      {interestTags && interestTags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spacing.sm }}>
          {interestTags.map((tag: string, index: number) => (
            <Tag key={tag} label={tag.charAt(0).toUpperCase() + tag.slice(1)} index={index} />
          ))}
        </View>
      ) : null}

      <Button
        label="Edit profile"
        variant="secondary"
        onPress={() => router.push("/(app)/profile/edit")}
        style={{ marginTop: theme.spacing.lg }}
      />
    </ScreenContainer>
  );
}
