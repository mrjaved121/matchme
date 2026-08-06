import { Image, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/useTheme";

type Props = {
  uri?: string | null;
  name?: string | null;
  size: number;
  online?: boolean;
  verified?: boolean;
};

// Ring + shadow treatment and the online dot (coral, white ring, bottom-right,
// ~1/4 of avatar size) are taken directly from the messages export.
export function Avatar({ uri, name, size, online, verified }: Props) {
  const theme = useTheme();
  const dotSize = Math.max(12, size * 0.28);
  const badgeSize = Math.max(16, size * 0.32);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: theme.color.surfaceSecondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Text style={{ fontSize: size * 0.36, fontWeight: "700", color: theme.color.primary }}>
            {name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        )}
      </View>
      {online ? (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: theme.color.online,
            borderWidth: 2,
            borderColor: theme.color.surface,
          }}
        />
      ) : null}
      {verified ? (
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: online ? dotSize + 2 : -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: theme.color.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: theme.color.surface,
          }}
        >
          <Ionicons name="checkmark-circle" size={badgeSize} color={theme.color.verifiedDark} />
        </View>
      ) : null}
    </View>
  );
}
