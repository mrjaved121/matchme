import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { calculateAge } from "../../../lib/discover";

type Prefs = {
  show_distance: boolean;
  show_age: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  read_receipts: boolean;
};

type Summary = {
  first_name: string | null;
  birthdate: string | null;
  city: string | null;
  is_verified: boolean;
  photoUri: string | null;
};

const NAV_ROUTES = {
  discoveryPreferences: "/(app)/discovery-preferences",
  notifications: "/(app)/settings/notifications",
  verification: "/(app)/settings/verification",
  safety: "/(app)/settings/safety",
  blocked: "/(app)/settings/blocked",
  privacy: "/(app)/settings/privacy",
  subscription: "/(app)/settings/subscription",
  help: "/(app)/settings/help",
  inviteFriends: "/(app)/invite-friends",
} as const;

export default function Settings() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const email = useAuthStore((s) => s.session!.user.email);
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["settings-summary", myId],
    queryFn: async (): Promise<Summary> => {
      const [{ data: profileRow }, { data: photoRow }] = await Promise.all([
        supabase.from("profiles").select("first_name, birthdate, city, is_verified").eq("id", myId).single(),
        supabase
          .from("profile_photos")
          .select("storage_path")
          .eq("profile_id", myId)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        first_name: profileRow?.first_name ?? null,
        birthdate: profileRow?.birthdate ?? null,
        city: profileRow?.city ?? null,
        is_verified: profileRow?.is_verified ?? false,
        photoUri: photoRow?.storage_path ? publicPhotoUrl(photoRow.storage_path) : null,
      };
    },
  });

  useEffect(() => {
    supabase
      .from("profiles")
      .select("show_distance, show_age, push_enabled, email_enabled, read_receipts")
      .eq("id", myId)
      .single()
      .then(({ data }) => data && setPrefs(data));
  }, [myId]);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await supabase.from("profiles").update({ [key]: next[key] }).eq("id", myId);
  }

  const age = summary?.birthdate ? calculateAge(summary.birthdate) : null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <Text
          style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
        >
          Settings
        </Text>

        <Pressable
          onPress={() => router.push("/(app)/profile/edit")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            ...theme.shadow.card,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
              backgroundColor: theme.color.surfaceSecondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {summary?.photoUri ? (
              <Image source={{ uri: summary.photoUri }} style={{ width: "100%", height: "100%" }} cachePolicy="memory-disk" />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: "700", color: theme.color.primary }}>
                {summary?.first_name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
              {summary?.first_name}
              {age ? `, ${age}` : ""}
            </Text>
            {summary?.is_verified ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Ionicons name="checkmark-circle" size={14} color={theme.color.verifiedDark} />
                <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Verified Profile</Text>
              </View>
            ) : null}
          </View>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.color.inputFill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="pencil" size={16} color={theme.color.textPrimary} />
          </View>
        </Pressable>

        <Section title="Discovery Settings" icon="radio-outline">
          <NavRow label="Discovery Preferences" caption={summary?.city ?? undefined} onPress={() => router.push(NAV_ROUTES.discoveryPreferences)} />
          {prefs ? (
            <>
              <ToggleRow
                label="Show My Distance"
                value={prefs.show_distance}
                onValueChange={() => toggle("show_distance")}
              />
              <ToggleRow label="Show My Age" value={prefs.show_age} onValueChange={() => toggle("show_age")} isLast />
            </>
          ) : null}
        </Section>

        <Section title="Account & Privacy" icon="shield-checkmark-outline">
          <InfoRow label="Email" value={email ?? ""} />
          <NavRow label="Get verified" onPress={() => router.push(NAV_ROUTES.verification)} />
          <NavRow label="Safety Center" onPress={() => router.push(NAV_ROUTES.safety)} />
          <NavRow label="Blocked users" onPress={() => router.push(NAV_ROUTES.blocked)} />
          <NavRow label="Privacy & account" onPress={() => router.push(NAV_ROUTES.privacy)} isLast />
        </Section>

        <Section title="Notifications" icon="notifications-outline">
          {prefs ? (
            <>
              <ToggleRow
                label="Push Notifications"
                value={prefs.push_enabled}
                onValueChange={() => toggle("push_enabled")}
              />
              <ToggleRow
                label="Email Notifications"
                value={prefs.email_enabled}
                onValueChange={() => toggle("email_enabled")}
              />
              <ToggleRow
                label="Read Receipts"
                value={prefs.read_receipts}
                onValueChange={() => toggle("read_receipts")}
              />
            </>
          ) : null}
          <NavRow label="Notification Settings" onPress={() => router.push(NAV_ROUTES.notifications)} isLast />
        </Section>

        <Section title="Subscription & Support" icon="star-outline">
          <NavRow label="Invite Friends — get free Gold" onPress={() => router.push(NAV_ROUTES.inviteFriends)} />
          <NavRow label="Manage Subscription" onPress={() => router.push(NAV_ROUTES.subscription)} />
          <NavRow label="Help & Support" onPress={() => router.push(NAV_ROUTES.help)} isLast />
        </Section>

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Pressable
            onPress={() => supabase.auth.signOut()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.input,
              paddingVertical: theme.spacing.md,
              ...theme.shadow.card,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.color.textPrimary} />
            <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>Log Out</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(NAV_ROUTES.privacy)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: theme.color.error + "18",
              borderRadius: theme.radius.input,
              paddingVertical: theme.spacing.md,
            }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.color.error} />
            <Text style={[theme.typography.label, { color: theme.color.error }]}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: theme.spacing.lg, gap: 2 }}>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>Spark v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, icon, children }: { title: string; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: theme.spacing.sm, paddingHorizontal: 2 }}>
        {icon ? <Ionicons name={icon} size={16} color={theme.color.primary} /> : null}
        <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{title}</Text>
      </View>
      <View style={{ backgroundColor: theme.color.surface, borderRadius: theme.radius.card, overflow: "hidden", ...theme.shadow.card }}>
        {children}
      </View>
    </View>
  );
}

function RowShell({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.color.border,
      }}
    >
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <RowShell isLast>
      <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{label}</Text>
      <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{value}</Text>
    </RowShell>
  );
}

function NavRow({
  label,
  caption,
  onPress,
  isLast,
}: {
  label: string;
  caption?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <RowShell isLast={isLast}>
        <View>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{label}</Text>
          {caption ? (
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 2 }]}>{caption}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.color.textSecondary} />
      </RowShell>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  isLast,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <RowShell isLast={isLast}>
      <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.color.primary }} />
    </RowShell>
  );
}
