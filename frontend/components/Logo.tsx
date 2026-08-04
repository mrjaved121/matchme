import { View } from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { useTheme } from "../theme/useTheme";

// Approximation of the export's "Just Spark" mark: a heart with small spark
// rays off its top-right shoulder. Recreated as a vector icon (not traced
// from the export's raster logo) so it scales cleanly at any size.
export function LogoMark({ size = 40, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  const c = color ?? theme.color.primary;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Path
          d="M20 30 L9 20.5 C6 17.8 6 13.4 9 10.8 C11.8 8.4 15.8 8.8 18 11.5 L20 14 L22 11.5 C24.2 8.8 28.2 8.4 31 10.8 C34 13.4 34 17.8 31 20.5 L20 30 Z"
          stroke={c}
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Line x1="30" y1="4" x2="30" y2="1" stroke={c} strokeWidth={2} strokeLinecap="round" />
        <Line x1="34.5" y1="6.5" x2="36.5" y2="4.5" stroke={c} strokeWidth={2} strokeLinecap="round" />
        <Line x1="37" y1="11" x2="40" y2="11" stroke={c} strokeWidth={2} strokeLinecap="round" />
        <Line x1="34.5" y1="15.5" x2="36.5" y2="17.5" stroke={c} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
