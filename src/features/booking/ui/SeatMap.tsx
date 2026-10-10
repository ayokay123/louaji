import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import type { SeatView, TripSeatMap } from "../core/entities/seat";

interface SeatMapProps {
  seatMap: TripSeatMap;
  selected: ReadonlySet<number>;
  onToggle: (seatNumber: number) => void;
}

function seatClasses(state: SeatView["state"], isSelected: boolean): string {
  if (isSelected) return "bg-brand-500";
  switch (state) {
    case "available":
      return "bg-surface border border-border";
    case "reserved":
      return "bg-surface-alt border border-border";
    case "blocked":
    case "driver":
      return "bg-border";
    default:
      return "bg-surface border border-border";
  }
}

// A single seat that springs up when selected — the booking flow's most
// satisfying micro-interaction. Spring scale on selection toggle; the fill
// (white-on-green) is driven by the className. transform-only animation.
function SeatTile({
  seat,
  isSelected,
  onToggle,
}: {
  seat: SeatView;
  isSelected: boolean;
  onToggle: (seatNumber: number) => void;
}) {
  const isAvailable = seat.state === "available";
  const isDriver = seat.state === "driver";
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.08 : 1,
      friction: 5,
      tension: 220,
      useNativeDriver: false,
    }).start();
  }, [isSelected, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={!isAvailable}
        onPress={() => onToggle(seat.number)}
        className={`h-12 w-12 items-center justify-center rounded-seat ${seatClasses(
          seat.state,
          isSelected,
        )}`}
      >
        {isDriver ? (
          <Ionicons name="car-outline" size={18} color="#5E6B64" />
        ) : (
          <Text
            className={`font-body-medium text-sm ${isSelected ? "text-white" : "text-ink-muted"}`}
          >
            {seat.number}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function SeatMap({ seatMap, selected, onToggle }: SeatMapProps) {
  const rows = Array.from({ length: seatMap.rows }, (_, r) => r);
  const cols = Array.from({ length: seatMap.cols }, (_, c) => c);

  const seatAt = (row: number, col: number): SeatView | undefined =>
    seatMap.seats.find((s) => s.row === row && s.col === col);

  return (
    <View className="gap-2.5">
      {rows.map((row) => (
        <View key={row} className="flex-row gap-2.5">
          {cols.map((col) => {
            const seat = seatAt(row, col);
            if (!seat) {
              return <View key={col} className="h-12 w-12" />;
            }
            return (
              <SeatTile
                key={col}
                seat={seat}
                isSelected={selected.has(seat.number)}
                onToggle={onToggle}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
