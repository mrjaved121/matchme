import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
}>;

export function ScreenContainer({ children, style, padded = true }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.color.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.flex,
          padded && { paddingHorizontal: theme.spacing.md },
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
