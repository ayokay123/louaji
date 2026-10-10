import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

// Reusable entrance primitive: content fades + slides up on mount. Honors the
// OS reduced-motion setting (renders instantly when motion is reduced). Animate
// transform + opacity only. Uses RN core Animated so it works on web without
// the reanimated worklets babel plugin; the production motion system should
// standardize on reanimated once that plugin is wired (see modernization plan).
interface FadeSlideInProps {
  children: ReactNode;
  /** Stagger delay in ms so sibling elements cascade in. */
  delay?: number;
}

export function FadeSlideIn({ children, delay = 0 }: FadeSlideInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [progress, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
