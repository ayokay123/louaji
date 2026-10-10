import { View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

// Flat hero illustration: a friendly louage van in front of a soft city
// skyline. Brand tints only (#1FA45D primary, #8FCDAC soft, #E7F4EC tint,
// #0B3D26 deep) so it stays on-system and crisp at any size. Decorative —
// pointerEvents none. See the booking-flow modernization plan.
interface LouageHeroProps {
  width?: number;
}

export function LouageHero({ width = 280 }: LouageHeroProps) {
  const height = (width * 168) / 280;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height} viewBox="0 0 280 168">
        {/* soft ground shadow */}
        <Ellipse cx="140" cy="150" rx="116" ry="11" fill="#E7F4EC" />

        {/* skyline (soft green) */}
        <G fill="#8FCDAC" opacity={0.55}>
          <Rect x="22" y="62" width="34" height="76" rx="5" />
          <Rect x="60" y="42" width="28" height="96" rx="5" />
          <Rect x="200" y="50" width="30" height="88" rx="5" />
          <Rect x="236" y="68" width="26" height="70" rx="5" />
        </G>
        <G fill="#E7F4EC">
          <Rect x="66" y="52" width="6" height="6" rx="1" />
          <Rect x="76" y="52" width="6" height="6" rx="1" />
          <Rect x="66" y="66" width="6" height="6" rx="1" />
          <Rect x="208" y="60" width="6" height="6" rx="1" />
          <Rect x="218" y="60" width="6" height="6" rx="1" />
        </G>

        {/* van body */}
        <Rect x="74" y="88" width="140" height="48" rx="13" fill="#1FA45D" />
        {/* windows (deep green) */}
        <G fill="#0B3D26" opacity={0.85}>
          <Rect x="86" y="96" width="40" height="22" rx="5" />
          <Rect x="132" y="96" width="40" height="22" rx="5" />
          <Rect x="178" y="96" width="28" height="22" rx="5" />
        </G>
        {/* brand stripe */}
        <Rect x="80" y="124" width="128" height="6" rx="3" fill="#E7F4EC" opacity={0.7} />
        {/* wheels */}
        <G>
          <Circle cx="104" cy="138" r="13" fill="#0B3D26" />
          <Circle cx="104" cy="138" r="5" fill="#8FCDAC" />
          <Circle cx="184" cy="138" r="13" fill="#0B3D26" />
          <Circle cx="184" cy="138" r="5" fill="#8FCDAC" />
        </G>
        {/* motion ticks for life */}
        <G stroke="#8FCDAC" strokeWidth="3.5" strokeLinecap="round">
          <Path d="M40 108 h18" />
          <Path d="M34 120 h12" />
        </G>
      </Svg>
    </View>
  );
}
