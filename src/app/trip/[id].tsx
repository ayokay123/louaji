import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SeatLegend, SeatMap } from "@/features/booking/ui";
import { useSeatMap, useTripDetail, useHoldSeats } from "@/features/booking/hooks";
import { ApiError } from "@/shared/lib/http/client";
import { useSession } from "@/shared/lib/auth/session";
import { formatDepartureTime } from "@/shared/lib/datetime";
import { formatMillimes } from "@/shared/lib/money";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function TripDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = firstParam(params["id"]);

  const { isAuthenticated } = useSession();
  const { data: trip, isLoading: tripLoading } = useTripDetail(tripId);
  const { data: seatMap, isLoading: seatLoading, refetch } = useSeatMap(tripId);
  const hold = useHoldSeats(tripId);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  function toggle(seatNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatNumber)) next.delete(seatNumber);
      else next.add(seatNumber);
      return next;
    });
  }

  async function confirmSeats() {
    const seatNumbers = Array.from(selected);
    if (seatNumbers.length === 0) return;
    setNotice(null);
    // Holding a seat requires a signed-in passenger (the hold is owned by a
    // user id). Send guests to sign in, carrying their selection so they land
    // back on checkout afterwards — rather than failing the hold with a 401.
    if (!isAuthenticated) {
      router.push({ pathname: "/(auth)/welcome", params: { redirect: `/trip/${tripId}` } });
      return;
    }
    try {
      await hold.mutateAsync(seatNumbers);
      router.push({
        pathname: "/booking/summary",
        params: { tripId, seatNumbers: seatNumbers.join(",") },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.tag === "SeatUnavailable") {
        setNotice(t("booking.seatTaken"));
        setSelected(new Set());
        void refetch();
      } else {
        setNotice(t("common.error"));
      }
    }
  }

  if (tripLoading || seatLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-alt" edges={["top"]}>
        <ActivityIndicator color="#1FA45D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 p-5 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="rounded-input p-1 active:bg-border"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="arrow-back" size={24} color="#1C2420" />
        </Pressable>
        <Text className="font-display text-xl text-ink">{t("trip.details")}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5 pt-2 pb-40">
        {trip ? (
          <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
            <View className="flex-row items-center gap-2">
              <Text className="font-display text-xl text-ink">{trip.originCity}</Text>
              <Ionicons name="arrow-forward" size={18} color="#5E6B64" />
              <Text className="font-display text-xl text-ink">{trip.destinationCity}</Text>
            </View>
            <View className="flex-row flex-wrap gap-x-5 gap-y-2">
              <Detail icon="calendar-outline" label={t("common.date")} value={trip.serviceDate} />
              <Detail
                icon="time-outline"
                label={t("trip.departure")}
                value={formatDepartureTime(trip.departureTime)}
              />
              {trip.estArrivalTime ? (
                <Detail
                  icon="flag-outline"
                  label={t("trip.arrival")}
                  value={formatDepartureTime(trip.estArrivalTime)}
                />
              ) : null}
              <Detail
                icon={trip.operator.isCompany ? "business-outline" : "person-outline"}
                label={t("trip.operator")}
                value={trip.operator.name}
              />
              {trip.vehicleModel ? (
                <Detail icon="car-outline" label={t("trip.vehicle")} value={trip.vehicleModel} />
              ) : null}
            </View>
            <View className="h-px bg-border" />
            <Text className="font-heading text-lg text-brand-700">
              {formatMillimes(trip.priceMillimes)}
            </Text>
          </View>
        ) : null}

        <View className="gap-4 rounded-card bg-surface p-4 shadow-sm">
          <Text className="font-heading text-lg text-ink">{t("trip.chooseSeat")}</Text>
          <SeatLegend />
          {seatMap ? (
            <View className="items-center">
              <SeatMap seatMap={seatMap} selected={selected} onToggle={toggle} />
            </View>
          ) : null}
        </View>

        {notice ? <Text className="font-body text-sm text-danger">{notice}</Text> : null}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-surface p-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-body text-sm text-ink-muted">
            {t("common.seats")}: {selected.size}
          </Text>
          {trip ? (
            <Text className="font-heading text-base text-ink">
              {formatMillimes(trip.priceMillimes * selected.size)}
            </Text>
          ) : null}
        </View>
        <Pressable
          disabled={selected.size === 0 || hold.isPending}
          onPress={confirmSeats}
          className={`items-center rounded-input py-3.5 ${
            selected.size > 0 && !hold.isPending
              ? "bg-brand-500 active:bg-brand-700"
              : "bg-brand-300"
          }`}
        >
          <Text className="font-body-medium text-base text-white">{t("common.next")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface DetailProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function Detail({ icon, label, value }: DetailProps) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color="#5E6B64" />
        <Text className="font-body text-xs text-ink-muted">{label}</Text>
      </View>
      <Text className="font-body-medium text-sm text-ink">{value}</Text>
    </View>
  );
}
