import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

type Person = { firstName: string | null; photoPath: string | null };

function Avatar({ person, size, borderColor }: { person: Person | null; size: number; borderColor: string }) {
  return person?.photoPath ? (
    <Image
      source={{ uri: publicPhotoUrl(person.photoPath) }}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor,
        backgroundColor: "rgba(255,255,255,0.35)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontWeight: "800", color: "#FFFFFF" }}>
        {person?.firstName?.[0]?.toUpperCase() ?? "?"}
      </Text>
    </View>
  );
}

export default function MatchConfirmation() {
  const theme = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [me, setMe] = useState<Person | null>(null);
  const [other, setOther] = useState<Person | null>(null);
  const [otherName, setOtherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: match } = await supabase
        .from("matches")
        .select("user_a_id, user_b_id")
        .eq("id", matchId)
        .single();

      if (cancelled || !match) {
        setLoading(false);
        return;
      }

      const otherId = match.user_a_id === myId ? match.user_b_id : match.user_a_id;

      const [{ data: profiles }, { data: photos }] = await Promise.all([
        supabase.from("profiles").select("id, first_name").in("id", [myId, otherId]),
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path")
          .in("profile_id", [myId, otherId])
          .eq("position", 0),
      ]);

      if (cancelled) return;

      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.first_name]));
      const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));

      setMe({ firstName: nameById.get(myId) ?? null, photoPath: photoById.get(myId) ?? null });
      setOther({ firstName: nameById.get(otherId) ?? null, photoPath: photoById.get(otherId) ?? null });
      setOtherName(nameById.get(otherId) ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [matchId, myId]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false} backgroundColor={theme.color.primaryGradient[1]}>
      <LinearGradient
        colors={[theme.color.primary, theme.color.primaryGradient[1]]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}
      >
        <View style={{ flexDirection: "row" }}>
          <View style={{ marginRight: -22, zIndex: 1 }}>
            <Avatar person={me} size={104} borderColor="rgba(255,255,255,0.9)" />
          </View>
          <Avatar person={other} size={104} borderColor="rgba(255,255,255,0.9)" />
        </View>

        <Text style={[theme.typography.display, { color: "#FFFFFF", textAlign: "center", fontSize: 34 }]}>
          It's a match!
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, textAlign: "center" }}>
          You and {otherName ?? "your match"} both said yes.
        </Text>

        <View style={{ width: "100%", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Button
            label="Send a message"
            variant="secondary"
            onPress={() =>
              router.replace({ pathname: "/(app)/matches/[matchId]", params: { matchId } })
            }
          />
          <Button
            label="Back to home"
            variant="ghost"
            textColor="#FFFFFF"
            onPress={() => router.replace("/(app)/home")}
          />
        </View>
      </LinearGradient>
    </ScreenContainer>
  );
}
