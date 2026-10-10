import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingCard } from "@/features/booking/ui";
import { useBookings, useCancelBooking } from "@/features/booking/hooks";
import type { BookingSummary } from "@/features/booking/core/entities/booking";
import { todayServiceDate } from "@/shared/lib/datetime";

type Segment = "upcoming" | "past";

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();
  const cancel = useCancelBooking();

  const [segment, setSegment] = useState<Segment>("upcoming");

  const { upcoming, past } = useMemo(() => {
    const today = todayServiceDate();
    const up: BookingSummary[] = [];
    const old: BookingSummary[] = [];
    for (const b of bookings ?? []) {
      if (b.serviceDate >= today && b.status !== "cancelled") up.push(b);
      else old.push(b);
    }
    return { upcoming: up, past: old };
  }, [bookings]);

  const list = segment === "upcoming" ? upcoming : past;

  function requestCancel(bookingId: string) {
    Alert.alert(t("booking.cancelBooking"), t("booking.cancelConfirm"), [
      { text: t("common.back"), style: "cancel" },
      {
        text: t("booking.cancelBooking"),
        style: "destructive",
        onPress: () => cancel.mutate(bookingId),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <View className="gap-4 p-5 pb-2">
        <Text className="font-display text-2xl text-ink">{t("nav.bookings")}</Text>
        <View className="flex-row gap-2 rounded-input bg-surface p-1">
          <SegmentTab
            label={t("booking.upcoming")}
            active={segment === "upcoming"}
            onPress={() => setSegment("upcoming")}
          />
          <SegmentTab
            label={t("booking.past")}
            active={segment === "past"}
            onPress={() => setSegment("past")}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(b) => b.id}
          contentContainerClassName="gap-3 px-5 pb-28"
          ListEmptyComponent={
            <Text className="py-16 text-center font-body text-base text-ink-muted">
              {t("booking.noBookings")}
            </Text>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={(id) => router.push(`/ticket/${id}`)}
              onCancel={
                segment === "upcoming" && item.status === "confirmed" ? requestCancel : undefined
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

interface SegmentTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function SegmentTab({ label, active, onPress }: SegmentTabProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-input py-2 ${active ? "bg-brand-500" : ""}`}
    >
      <Text className={`font-body-medium text-sm ${active ? "text-white" : "text-ink-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
