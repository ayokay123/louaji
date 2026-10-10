import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/shared/lib/http/client";
import { useCreateVehicle, useVehicles } from "@/features/fleet/hooks";
import { SeatGridDesigner } from "@/features/fleet/ui/SeatGridDesigner";
import {
  type CellKind,
  emptyGrid,
  gridSeatCount,
  gridToLayout,
} from "@/features/fleet/core/use-cases/seatGrid";
import type { Vehicle } from "@/features/fleet/core/entities/vehicle";

// Default louage shape: 4 rows × 3 cols (a common 8-seat van footprint). The
// operator tailors the actual seats in the designer.
const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 3;

export default function FleetScreen() {
  const { t } = useTranslation();
  const vehicles = useVehicles();
  const createVehicle = useCreateVehicle();

  const [adding, setAdding] = useState(false);
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [grid, setGrid] = useState<CellKind[][]>(() => emptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [error, setError] = useState<string | null>(null);

  const seatCount = gridSeatCount(grid);

  const reset = () => {
    setAdding(false);
    setPlate("");
    setModel("");
    setGrid(emptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
    setError(null);
  };

  const submit = () => {
    setError(null);
    createVehicle.mutate(
      {
        plate: plate.trim(),
        model: model.trim() ? model.trim() : null,
        seatLayout: gridToLayout(grid),
      },
      {
        onSuccess: reset,
        onError: (err) => setError(err instanceof ApiError ? err.message : t("common.error")),
      },
    );
  };

  const canSubmit = plate.trim().length >= 1 && seatCount >= 1 && !createVehicle.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-xl text-ink">{t("operator.vehicles")}</Text>
          {!adding && (
            <Pressable
              onPress={() => setAdding(true)}
              className="flex-row items-center gap-1.5 rounded-input bg-brand-500 px-4 py-2.5 active:bg-brand-700"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="font-body-medium text-sm text-white">
                {t("operator.addVehicle")}
              </Text>
            </Pressable>
          )}
        </View>

        {adding && (
          <View className="gap-4 rounded-card bg-surface p-4 shadow-sm">
            <Field label={t("operator.plate")} value={plate} onChangeText={setPlate} />
            <Field label={t("operator.model")} value={model} onChangeText={setModel} />

            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink">{t("operator.seatLayout")}</Text>
              <SeatGridDesigner grid={grid} onChange={setGrid} />
              <Text className="font-body text-xs text-ink-muted">
                {t("operator.seatCount")}: {seatCount}
              </Text>
            </View>

            {error && <Text className="font-body text-sm text-danger">{error}</Text>}

            <View className="flex-row gap-3">
              <Pressable
                onPress={reset}
                className="flex-1 items-center rounded-input border border-border py-3 active:opacity-80"
              >
                <Text className="font-body-medium text-sm text-ink-muted">
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                className={`flex-1 items-center rounded-input py-3 ${canSubmit ? "bg-brand-500 active:bg-brand-700" : "bg-brand-100"}`}
              >
                {createVehicle.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-body-medium text-sm text-white">{t("common.save")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {vehicles.isLoading ? (
          <ActivityIndicator color="#1FA45D" />
        ) : (vehicles.data?.length ?? 0) === 0 ? (
          <Text className="font-body text-sm text-ink-muted">{t("common.empty")}</Text>
        ) : (
          <View className="gap-3">
            {vehicles.data?.map((vehicle) => (
              <VehicleRow key={vehicle.id} vehicle={vehicle} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-4 shadow-sm">
      <Ionicons name="bus-outline" size={24} color="#1FA45D" />
      <View className="flex-1">
        <Text className="font-heading text-base text-ink">{vehicle.plate}</Text>
        {vehicle.model && <Text className="font-body text-sm text-ink-muted">{vehicle.model}</Text>}
      </View>
      <Text className="font-body-medium text-sm text-ink">
        {vehicle.seatCount} {t("operator.seatCount")}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-ink">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9AA8A0"
        className="rounded-input border border-border bg-surface px-4 py-3 font-body text-base text-ink"
      />
    </View>
  );
}
