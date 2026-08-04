import { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { ensureReferralCode, fetchReferralHistory } from "../../lib/referral";

export default function InviteFriends() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [copied, setCopied] = useState(false);

  const { data: code, isLoading: codeLoading } = useQuery({
    queryKey: ["my-referral-code", myId],
    queryFn: () => ensureReferralCode(myId),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["referral-history", myId],
    queryFn: () => fetchReferralHistory(myId),
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const link = code ? `https://spark.app/welcome?ref=${code}` : null;
  const joinedCount = history?.filter((h) => h.onboarding_completed).length ?? 0;
  const weeksEarned = joinedCount; // 1 week of Gold per completed referral

  async function copyLink() {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
  }

  async function shareLink() {
    if (!link) return;
    try {
      await Share.share({ message: `Join me on Spark — use my invite link: ${link}` });
    } catch {
      // User dismissed the native share sheet — nothing to do.
    }
  }

  if (codeLoading || historyLoading) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.color.textPrimary, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Invite Friends</Text>
        </View>

        <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
          Give a week of Gold, get a week of Gold — for every friend who joins with your link and finishes their
          profile.
        </Text>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          <StatTile label="Invited" value={history?.length ?? 0} icon="✉️" />
          <StatTile label="Joined" value={joinedCount} icon="🎉" />
          <StatTile label="Gold Weeks Earned" value={weeksEarned} icon="👑" />
        </View>

        {link ? (
          <View
            style={{
              alignItems: "center",
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.card,
              borderWidth: 1,
              borderColor: theme.color.border,
              padding: theme.spacing.lg,
              marginTop: theme.spacing.lg,
            }}
          >
            <View style={{ backgroundColor: "#FFFFFF", padding: theme.spacing.md, borderRadius: theme.radius.card }}>
              <QRCode value={link} size={160} />
            </View>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: theme.spacing.sm }]}>
              Scan to use my invite
            </Text>
          </View>
        ) : null}

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

        <Button label="Share Invite" onPress={shareLink} style={{ marginTop: theme.spacing.md }} />

        {history && history.length > 0 ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: theme.spacing.sm },
              ]}
            >
              Your Invites
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              {history.map((h) => (
                <View
                  key={h.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: theme.color.surface,
                    borderRadius: theme.radius.card,
                    padding: theme.spacing.md,
                  }}
                >
                  <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>
                    {h.first_name ?? "New user"}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: h.onboarding_completed ? theme.color.success : theme.color.textSecondary, fontWeight: "700" },
                    ]}
                  >
                    {h.onboarding_completed ? "Joined ✓" : "Pending…"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center", marginTop: theme.spacing.lg }]}>
          Demo link — there's no public web viewer yet, so opening it outside the app won't show anything. The
          referral code itself is applied for real when someone signs up through the app with it.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 2,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>{value}</Text>
      <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>{label}</Text>
    </View>
  );
}
