import { FlatList, Image, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { EmptyState, ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

type BlockedUser = { id: string; name: string | null; photoPath: string | null };

export default function BlockedUsers() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["blocked-users", myId],
    queryFn: async () => {
      const { data: blocks, error } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", myId);
      if (error) throw error;
      if (!blocks || blocks.length === 0) return [] as BlockedUser[];

      const ids = blocks.map((b) => b.blocked_id);
      const [{ data: profiles }, { data: photos }] = await Promise.all([
        supabase.from("profiles").select("id, first_name").in("id", ids),
        supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", ids).eq("position", 0),
      ]);

      const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));
      return ids.map((id) => ({
        id,
        name: profiles?.find((p) => p.id === id)?.first_name ?? null,
        photoPath: photoById.get(id) ?? null,
      }));
    },
  });

  async function unblock(id: string) {
    await supabase.from("blocks").delete().eq("blocker_id", myId).eq("blocked_id", id);
    queryClient.invalidateQueries({ queryKey: ["blocked-users", myId] });
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading…" />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text
        style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
      >
        Blocked users
      </Text>

      {!data || data.length === 0 ? (
        <EmptyState title="No blocked users" description="Anyone you block will show up here so you can unblock them later." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                padding: theme.spacing.sm,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.card,
                borderWidth: 1,
                borderColor: theme.color.border,
              }}
            >
              {item.photoPath ? (
                <Image source={{ uri: publicPhotoUrl(item.photoPath) }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{item.name?.[0]?.toUpperCase() ?? "?"}</Text>
                </View>
              )}
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, flex: 1 }]}>
                {item.name ?? "MatchMe user"}
              </Text>
              <Button label="Unblock" variant="ghost" onPress={() => unblock(item.id)} />
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
