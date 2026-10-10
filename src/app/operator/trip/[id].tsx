import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCancelTrip, useMarkBoarding, useSeatBoard } from "@/features/trips/hooks";
import { SeatBoardGrid } from "@/features/trips/ui/SeatBoardGrid";
import type { BoardSeat } from "@/features/trips/core/entities/board";

// Operator seat board for one trip: occupancy, the seat grid, the booked
// passenger details, boarding marks (boarded / no_show), and trip cancel.
export default function SeatBoardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = String(id);

  const board = useSeatBoard(tripId);
  const markBoarding = useMarkBoarding(tripId);
  const cancelTrip = useCancelTrip();

  const [selected, setSelected] = useState<BoardSeat | null>(null);

  if (board.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      </SafeAreaView>
    );
  }

  if (!board.data) {
    return (
      <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-body text-base text-ink-muted">{t("common.error")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const data = board.data;
  const canCancel = data.status === "scheduled" || data.status === "boarding";

  const mark = (status: "boarded" | "no_show") => {
    if (!selected?.bookingId) return;
    markBoarding.mutate(
      { bookingId: selected.bookingId, status },
      { onSuccess: () => setSelected(null) },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <View className="gap-1 rounded-card bg-surface p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Text className="font-heading text-lg text-ink">{data.originCity}</Text>
            <Ionicons name="arrow-forward" size={16} color="#5E6B64" />
            <Text className="font-heading text-lg text-ink">{data.destinationCity}</Text>
          </View>
          <Text className="font-body text-sm text-ink-muted">
            {data.serviceDate} · {data.departureTime}
          </Text>
          <Text className="font-body-medium text-sm text-ink">
            {t("operator.occupancy")}: {data.bookedSeats}/{data.totalSeats}
          </Text>
        </View>

        <Text className="font-heading text-lg text-ink">{t("operator.seatBoard")}</Text>
        <SeatBoardGrid
          board={data}
          selectedSeat={selected?.number ?? null}
          onSelectSeat={setSelected}
        />

        {selected?.bookingId && (
          <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
            <View className="gap-0.5">
              <Text className="font-heading text-base text-ink">{selected.passengerName}</Text>
              <Text className="font-body text-sm text-ink-muted">{selected.passengerPhone}</Text>
              <Text className="font-body text-xs text-ink-muted">
                {t("common.seats")}: {selected.number}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => mark("boarded")}
                disabled={markBoarding.isPending}
                className="flex-1 items-center rounded-input bg-success py-3 active:opacity-90"
              >
                <Text className="font-body-medium text-sm text-white">
                  {t("operator.markBoarded")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => mark("no_show")}
                disabled={markBoarding.isPending}
                className="flex-1 items-center rounded-input bg-danger py-3 active:opacity-90"
              >
                <Text className="font-body-medium text-sm text-white">
                  {t("operator.markNoShow")}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="gap-2">
          <Text className="font-heading text-lg text-ink">{t("operator.passengers")}</Text>
          {data.seats.filter((s) => s.state === "booked").length === 0 ? (
            <Text className="font-body text-sm text-ink-muted">{t("common.empty")}</Text>
          ) : (
            data.seats
              .filter((s) => s.state === "booked")
              .map((seat) => <PassengerRow key={seat.number} seat={seat} />)
          )}
        </View>

        {canCancel && (
          <Pressable
            onPress={() => cancelTrip.mutate(tripId, { onSuccess: () => router.back() })}
            disabled={cancelTrip.isPending}
            className="mt-2 items-center rounded-input border border-danger py-3.5 active:opacity-80"
          >
            {cancelTrip.isPending ? (
              <ActivityIndicator color="#D14343" />
            ) : (
              <Text className="font-body-medium text-base text-danger">
                {t("operator.cancelTrip")}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PassengerRow({ seat }: { seat: BoardSeat }) {
  const tone =
    seat.bookingStatus === "boarded"
      ? "text-success"
      : seat.bookingStatus === "no_show"
        ? "text-danger"
        : "text-ink-muted";
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-3 shadow-sm">
      <View className="h-9 w-9 items-center justify-center rounded-seat bg-brand-100">
        <Text className="font-body-medium text-sm text-brand-700">{seat.number}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-medium text-sm text-ink">{seat.passengerName}</Text>
        <Text className="font-body text-xs text-ink-muted">{seat.passengerPhone}</Text>
      </View>
      <Text className={`font-body text-xs ${tone}`}>{seat.bookingStatus}</Text>
    </View>
  );
}
