import { Component, PropsWithChildren, ReactNode } from "react";
import { Appearance, Text, View } from "react-native";
import { Button } from "./Button";
import { palette, spacing, typography } from "../theme/tokens";

type State = { error: Error | null };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      const colors = palette[Appearance.getColorScheme() === "dark" ? "dark" : "light"];

      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.md,
            padding: spacing.lg,
            backgroundColor: colors.background,
          }}
        >
          <Text style={[typography.title, { color: colors.textPrimary, textAlign: "center" }]}>
            Something went wrong
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
            Give it another try — if this keeps happening, restart the app.
          </Text>
          <Button label="Retry" onPress={this.reset} />
        </View>
      );
    }

    return this.props.children;
  }
}
