import { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "./ScreenContainer";
import { Button } from "./Button";
import { useTheme } from "../theme/useTheme";

type Props = PropsWithChildren<{
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  canGoBack?: boolean;
}>;

export function OnboardingStepLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  canGoBack = true,
}: Props) {
  const theme = useTheme();
  const progress = step / totalSteps;

  return (
    <ScreenContainer>
      <View style={{ flex: 1, gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View
          style={{
            height: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.surfaceVariant,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: theme.color.primary,
            }}
          />
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.displayLg, { color: theme.color.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ flex: 1 }}>{children}</View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
          />
          {canGoBack ? (
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
}
