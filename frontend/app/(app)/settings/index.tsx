import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

type Prefs = {
  show_distance: boolean;
  show_age: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  read_receipts: boolean;
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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <Text
          style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
        >
          Settings
        </Text>

        <Section title="Account">
          <InfoRow label="Email" value={email ?? ""} />
        </Section>

        <Section title="Discovery">
          <NavRow label="Discovery Preferences" onPress={() => router.push(NAV_ROUTES.discoveryPreferences)} />
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

        <Section title="Notifications">
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

        <Section title="Privacy & Safety">
          <NavRow label="Get verified" onPress={() => router.push(NAV_ROUTES.verification)} />
          <NavRow label="Safety Center" onPress={() => router.push(NAV_ROUTES.safety)} />
          <NavRow label="Blocked users" onPress={() => router.push(NAV_ROUTES.blocked)} />
          <NavRow label="Privacy & account" onPress={() => router.push(NAV_ROUTES.privacy)} isLast />
        </Section>

        <Section title="Subscription & Support">
          <NavRow label="Invite Friends — get free Gold" onPress={() => router.push(NAV_ROUTES.inviteFriends)} />
          <NavRow label="Manage Subscription" onPress={() => router.push(NAV_ROUTES.subscription)} />
          <NavRow label="Help & Support" onPress={() => router.push(NAV_ROUTES.help)} isLast />
        </Section>

        <Button
          label="Log out"
          variant="secondary"
          onPress={() => supabase.auth.signOut()}
          style={{ marginTop: theme.spacing.md }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.color.textSecondary, textTransform: "uppercase", marginBottom: theme.spacing.xs, letterSpacing: 0.5 },
        ]}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: theme.color.surface, borderRadius: theme.radius.card, overflow: "hidden" }}>
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

function NavRow({ label, onPress, isLast }: { label: string; onPress: () => void; isLast?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <RowShell isLast={isLast}>
        <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{label}</Text>
        <Text style={{ color: theme.color.textSecondary, fontSize: 18 }}>›</Text>
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
