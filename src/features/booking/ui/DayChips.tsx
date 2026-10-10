import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";
import { todayServiceDate } from "@/shared/lib/datetime";

interface DayChipsProps {
  /** Centre date (YYYY-MM-DD) the strip is built around. */
  baseDate: string;
  /** Currently selected date (YYYY-MM-DD). */
  selectedDate: string;
  onSelect: (date: string) => void;
  /** Days before/after the base date to render. Defaults to 3. */
  span?: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function labelFor(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T00:00:00`);
  return {
    weekday: WEEKDAYS[d.getDay()] ?? "",
    day: String(d.getDate()),
  };
}

export function DayChips({ baseDate, selectedDate, onSelect, span = 3 }: DayChipsProps) {
  const { t } = useTranslation();
  const today = todayServiceDate();
  const offsets = Array.from({ length: span * 2 + 1 }, (_, i) => i - span);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-1"
    >
      {offsets.map((offset) => {
        const date = shiftDate(baseDate, offset);
        const isSelected = date === selectedDate;
        const isToday = date === today;
        const { weekday, day } = labelFor(date);
        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            className={`min-w-16 items-center rounded-input px-3 py-2 ${
              isSelected ? "bg-brand-500" : "border border-border bg-surface"
            }`}
          >
            <Text className={`font-body text-xs ${isSelected ? "text-white" : "text-ink-muted"}`}>
              {isToday ? t("common.today") : weekday}
            </Text>
            <Text className={`font-heading text-base ${isSelected ? "text-white" : "text-ink"}`}>
              {day}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
