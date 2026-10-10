import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface LegendItem {
  key: string;
  swatch: string;
}

const ITEMS: LegendItem[] = [
  { key: "trip.seatStates.available", swatch: "bg-surface border border-border" },
  { key: "trip.seatStates.selected", swatch: "bg-brand-500" },
  { key: "trip.seatStates.reserved", swatch: "bg-surface-alt border border-border" },
  { key: "trip.seatStates.driver", swatch: "bg-border" },
];

export function SeatLegend() {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-2">
      {ITEMS.map((item) => (
        <View key={item.key} className="flex-row items-center gap-2">
          <View className={`h-4 w-4 rounded-seat ${item.swatch}`} />
          <Text className="font-body text-xs text-ink-muted">{t(item.key)}</Text>
        </View>
      ))}
    </View>
  );
}
