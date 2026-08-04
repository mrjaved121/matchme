import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
  /** Override the safe-area background — for a screen that goes full-bleed with its own color/gradient. */
  backgroundColor?: string;
}>;

export function ScreenContainer({ children, style, padded = true, backgroundColor }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: backgroundColor ?? theme.color.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.flex,
          padded && { paddingHorizontal: theme.spacing.screen },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
