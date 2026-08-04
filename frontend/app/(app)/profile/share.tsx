import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { Tag } from "../../../components/Tag";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { calculateAge } from "../../../lib/discover";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

async function ensureShareSlug(myId: string, firstName: string | null): Promise<string> {
  const { data } = await supabase.from("profiles").select("share_slug").eq("id", myId).single();
  if (data?.share_slug) return data.share_slug;

  const base = (firstName ?? "user").toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = `${base}_${randomSuffix()}`;
    const { error } = await supabase.from("profiles").update({ share_slug: candidate }).eq("id", myId);
    if (!error) return candidate;
  }
  throw new Error("Couldn't generate a share link — try again.");
}

type ShareProfile = {
  first_name: string | null;
  age: number | null;
  city: string | null;
  job_title: string | null;
  interest_tags: string[];
};

export default function ShareProfile() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-share-profile", myId],
    queryFn: async (): Promise<ShareProfile> => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, birthdate, city, job_title, interest_tags")
        .eq("id", myId)
        .single();
      return {
        first_name: data?.first_name ?? null,
        age: data?.birthdate ? calculateAge(data.birthdate) : null,
        city: data?.city ?? null,
        job_title: data?.job_title ?? null,
        interest_tags: data?.interest_tags ?? [],
      };
    },
  });

  const { data: slug, isLoading: slugLoading } = useQuery({
    queryKey: ["my-share-slug", myId],
    queryFn: () => ensureShareSlug(myId, profile?.first_name ?? null),
    enabled: !!profile,
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const link = slug ? `https://spark.app/u/${slug}` : null;

  async function copyLink() {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
  }

  async function shareLink() {
    if (!link) return;
    try {
      await Share.share({ message: `Check out my Spark profile: ${link}` });
    } catch {
      Alert.alert("Couldn't open share sheet");
    }
  }

  if (profileLoading || slugLoading || !profile) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.color.textPrimary, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Share Profile</Text>
        </View>

        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            borderWidth: 1,
            borderColor: theme.color.border,
            padding: theme.spacing.lg,
            alignItems: "center",
          }}
        >
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
            {profile.first_name ?? "Spark user"}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          {profile.city || profile.job_title ? (
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginTop: 2 }]}>
              {[profile.city, profile.job_title].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          {profile.interest_tags.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: theme.spacing.sm }}>
              {profile.interest_tags.slice(0, 4).map((tag, index) => (
                <Tag key={tag} label={tag.charAt(0).toUpperCase() + tag.slice(1)} index={index} />
              ))}
            </View>
          ) : null}

          {link ? (
            <View
              style={{
                marginTop: theme.spacing.lg,
                backgroundColor: "#FFFFFF",
                padding: theme.spacing.md,
                borderRadius: theme.radius.card,
              }}
            >
              <QRCode value={link} size={180} />
              <View
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: [{ translateX: -18 }, { translateY: -18 }],
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: theme.color.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>S</Text>
              </View>
            </View>
          ) : null}

          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: theme.spacing.sm }]}>
            Scan to view my Spark profile
          </Text>
        </View>

        {link ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.card,
              borderWidth: 1,
              borderColor: theme.color.border,
              padding: theme.spacing.md,
              marginTop: theme.spacing.md,
            }}
          >
            <Text numberOfLines={1} style={[theme.typography.subtext, { color: theme.color.textSecondary, flex: 1 }]}>
              {link.replace("https://", "")}
            </Text>
            <Button label={copied ? "Copied" : "Copy Link"} onPress={copyLink} style={{ paddingHorizontal: 16 }} />
          </View>
        ) : null}

        <Button label="Share" onPress={shareLink} style={{ marginTop: theme.spacing.md }} />

        <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center", marginTop: theme.spacing.md }]}>
          Demo link — there's no public web viewer yet, so opening it outside the app won't show a profile.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
