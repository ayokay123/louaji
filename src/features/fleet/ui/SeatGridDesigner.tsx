import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { type CellKind, nextCellKind } from "../core/use-cases/seatGrid";

// A grid editor: each cell cycles empty → passenger → driver → blocked on tap.
// The parent owns the grid state and calls `gridToLayout` on submit. Driver and
// blocked cells never become bookable inventory.

interface SeatGridDesignerProps {
  grid: CellKind[][];
  onChange: (grid: CellKind[][]) => void;
}

const CELL_STYLE: Record<CellKind, string> = {
  empty: "bg-surface-alt border-border",
  passenger: "bg-brand-100 border-brand-500",
  driver: "bg-warning/25 border-warning",
  blocked: "bg-danger/15 border-danger",
};

const CELL_GLYPH: Record<CellKind, string> = {
  empty: "",
  passenger: "P",
  driver: "D",
  blocked: "×",
};

export function SeatGridDesigner({ grid, onChange }: SeatGridDesignerProps) {
  const { t } = useTranslation();

  const toggle = (row: number, col: number) => {
    const next = grid.map((line, r) =>
      line.map((cell, c) => (r === row && c === col ? nextCellKind(cell) : cell)),
    );
    onChange(next);
  };

  return (
    <View className="gap-3">
      <View className="gap-2 self-start rounded-card bg-surface p-3 shadow-sm">
        {grid.map((line, row) => (
          <View key={row} className="flex-row gap-2">
            {line.map((cell, col) => (
              <Pressable
                key={col}
                onPress={() => toggle(row, col)}
                className={`h-11 w-11 items-center justify-center rounded-seat border ${CELL_STYLE[cell]}`}
              >
                <Text className="font-body-medium text-sm text-ink">{CELL_GLYPH[cell]}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Legend tone={CELL_STYLE.passenger} label={t("trip.seatStates.available")} />
        <Legend tone={CELL_STYLE.driver} label={t("trip.seatStates.driver")} />
        <Legend tone={CELL_STYLE.blocked} label={t("trip.seatStates.blocked")} />
      </View>
    </View>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-4 w-4 rounded-seat border ${tone}`} />
      <Text className="font-body text-xs text-ink-muted">{label}</Text>
    </View>
  );
}
