import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text } from "react-native";
import { formatMillimes } from "@/shared/lib/money";

// Counts a money value up from zero on mount / when it changes, formatted as
// `X.XXX دت`. A small delight on totals (summary, seat-board). Honors
// reduced-motion (shows the final value instantly).
interface AnimatedPriceProps {
  millimes: number;
  className?: string;
}

export function AnimatedPrice({ millimes, className = "" }: AnimatedPriceProps) {
  const value = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(millimes);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        setDisplay(millimes);
        return;
      }
      value.setValue(0);
      const id = value.addListener(({ value: v }) => setDisplay(Math.round(v)));
      Animated.timing(value, {
        toValue: millimes,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => value.removeListener(id));
    });
    return () => {
      cancelled = true;
    };
  }, [millimes, value]);

  return <Text className={className}>{formatMillimes(display)}</Text>;
}
