import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";

// Signature booking-success celebration: a check badge springs in while a
// confetti burst radiates and falls. Replaces the static checkmark — this is
// the mockup's celebratory moment. Brand greens + one warm accent. Honors
// reduced-motion (renders the badge, no burst). RN core Animated (web-safe).

const COLORS = ["#1FA45D", "#8FCDAC", "#E0A030", "#0B3D26"];
const PIECES = Array.from({ length: 14 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 14 + (i % 2 ? 0.3 : 0);
  const dist = 64 + (i % 3) * 26;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist - 24,
    color: COLORS[i % COLORS.length],
    rot: (i % 2 ? 1 : -1) * (180 + (i % 3) * 90),
    size: 7 + (i % 3) * 2,
  };
});

export function SuccessBurst() {
  const check = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        check.setValue(1);
        return;
      }
      Animated.spring(check, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: false,
      }).start();
      Animated.timing(burst, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [check, burst]);

  const scale = check.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={{ height: 120, width: 120, alignItems: "center", justifyContent: "center" }}>
      {PIECES.map((pc, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            width: pc.size,
            height: pc.size,
            borderRadius: 2,
            backgroundColor: pc.color,
            opacity: burst.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, pc.dx] }) },
              {
                translateY: burst.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, pc.dy, pc.dy + 56],
                }),
              },
              {
                rotate: burst.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${pc.rot}deg`],
                }),
              },
            ],
          }}
        />
      ))}
      <Animated.View
        style={{
          transform: [{ scale }],
          height: 80,
          width: 80,
          borderRadius: 40,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#E7F4EC",
        }}
      >
        <Ionicons name="checkmark-circle" size={56} color="#1FA45D" />
      </Animated.View>
    </View>
  );
}
