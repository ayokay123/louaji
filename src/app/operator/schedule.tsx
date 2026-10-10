import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/shared/lib/http/client";
import { useRoutes } from "@/features/catalog/hooks";
import { useVehicles } from "@/features/fleet/hooks";
import { useScheduleTrip } from "@/features/trips/hooks";
import { dinarsToMillimes } from "@/shared/lib/money";
import { todayServiceDate } from "@/shared/lib/datetime";

// Schedule a new trip: pick a route + vehicle, enter date/time and price. Price
// is entered in dinars and converted to integer millimes before sending.
export default function ScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const routes = useRoutes();
  const vehicles = useVehicles();
  const schedule = useScheduleTrip();

  const [routeId, setRouteId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState(todayServiceDate());
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [priceDinars, setPriceDinars] = useState("");
  const [error, setError] = useState<string | null>(null);

  const priceValue = Number.parseFloat(priceDinars.replace(",", "."));
  const canSubmit =
    routeId != null &&
    vehicleId != null &&
    /^\d{4}-\d{2}-\d{2}$/.test(serviceDate) &&
    /^\d{2}:\d{2}$/.test(departureTime) &&
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    !schedule.isPending;

  const submit = () => {
    if (routeId == null || vehicleId == null) return;
    setError(null);
    schedule.mutate(
      {
        routeId,
        vehicleId,
        serviceDate,
        departureTime,
        estArrivalTime: /^\d{2}:\d{2}$/.test(arrivalTime) ? arrivalTime : null,
        priceMillimes: dinarsToMillimes(priceValue),
        driverId: null,
      },
      {
        onSuccess: () => router.replace("/operator"),
        onError: (err) => setError(err instanceof ApiError ? err.message : t("common.error")),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <Picker
          label={t("operator.selectRoute")}
          loading={routes.isLoading}
          options={(routes.data ?? []).map((r) => ({
            id: r.id,
            label: `${r.originCity} → ${r.destinationCity}`,
          }))}
          selectedId={routeId}
          onSelect={setRouteId}
        />

        <Picker
          label={t("operator.assignVehicle")}
          loading={vehicles.isLoading}
          options={(vehicles.data ?? []).map((v) => ({
            id: v.id,
            label: `${v.plate} · ${v.seatCount}`,
          }))}
          selectedId={vehicleId}
          onSelect={setVehicleId}
          emptyHint={t("common.empty")}
        />

        <Field
          label={t("common.date")}
          value={serviceDate}
          onChangeText={setServiceDate}
          placeholder="YYYY-MM-DD"
        />
        <Field
          label={t("operator.departureTime")}
          value={departureTime}
          onChangeText={setDepartureTime}
          placeholder="HH:mm"
        />
        <Field
          label={t("operator.arrivalTime")}
          value={arrivalTime}
          onChangeText={setArrivalTime}
          placeholder="HH:mm"
        />
        <Field
          label={t("operator.pricePerSeat")}
          value={priceDinars}
          onChangeText={setPriceDinars}
          placeholder="0.000"
          keyboardType="decimal-pad"
        />

        {error && <Text className="font-body text-sm text-danger">{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={`items-center rounded-input py-3.5 ${canSubmit ? "bg-brand-500 active:bg-brand-700" : "bg-brand-100"}`}
        >
          {schedule.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-body-medium text-base text-white">
              {t("operator.publishTrip")}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface Option {
  id: string;
  label: string;
}

function Picker({
  label,
  options,
  selectedId,
  onSelect,
  loading,
  emptyHint,
}: {
  label: string;
  options: Option[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyHint?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="font-body-medium text-sm text-ink">{label}</Text>
      {loading ? (
        <ActivityIndicator color="#1FA45D" />
      ) : options.length === 0 ? (
        <Text className="font-body text-sm text-ink-muted">{emptyHint ?? "—"}</Text>
      ) : (
        <View className="gap-2">
          {options.map((opt) => {
            const active = opt.id === selectedId;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onSelect(opt.id)}
                className={`flex-row items-center justify-between rounded-input border px-4 py-3 ${active ? "border-brand-500 bg-brand-100" : "border-border bg-surface"}`}
              >
                <Text className={`font-body text-base ${active ? "text-brand-700" : "text-ink"}`}>
                  {opt.label}
                </Text>
                {active && <View className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-ink">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA8A0"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        className="rounded-input border border-border bg-surface px-4 py-3 font-body text-base text-ink"
      />
    </View>
  );
}
