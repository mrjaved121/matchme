import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

type Prefs = {
  notify_matches: boolean;
  notify_messages: boolean;
  notify_marketing: boolean;
};

const ROWS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "notify_matches", label: "New matches", description: "When you get a mutual match." },
  { key: "notify_messages", label: "New messages", description: "When someone sends you a message." },
  { key: "notify_marketing", label: "News & tips", description: "Occasional product updates." },
];

export default function NotificationSettings() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loadError, setLoadError] = useState(false);

  function loadPrefs() {
    setLoadError(false);
    supabase
      .from("profiles")
      .select("notify_matches, notify_messages, notify_marketing")
      .eq("id", myId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadError(true);
          return;
        }
        setPrefs(data);
      });
  }

  useEffect(() => {
    loadPrefs();
  }, [myId]);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await supabase.from("profiles").update({ [key]: next[key] }).eq("id", myId);
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={loadPrefs} />
      </ScreenContainer>
    );
  }

  if (!prefs) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text
        style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
      >
        Notifications
      </Text>

      <View style={{ gap: theme.spacing.md }}>
        {ROWS.map((row) => (
          <View
            key={row.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{row.label}</Text>
              <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
                {row.description}
              </Text>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={() => toggle(row.key)}
              trackColor={{ true: theme.color.primary }}
            />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
