import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBookings } from "@/features/booking/hooks";
import type { BookingSummary } from "@/features/booking/core/entities/booking";
import { formatDepartureTime, todayServiceDate } from "@/shared/lib/datetime";

export default function TicketsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();

  const tickets = useMemo(() => {
    const today = todayServiceDate();
    return (bookings ?? []).filter((b) => b.status === "confirmed" && b.serviceDate >= today);
  }, [bookings]);

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <View className="p-5 pb-2">
        <Text className="font-display text-2xl text-ink">{t("nav.tickets")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(b) => b.id}
          contentContainerClassName="gap-3 px-5 pb-28"
          ListEmptyComponent={
            <Text className="py-16 text-center font-body text-base text-ink-muted">
              {t("booking.noBookings")}
            </Text>
          }
          renderItem={({ item }) => (
            <TicketRow booking={item} onPress={() => router.push(`/ticket/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

interface TicketRowProps {
  booking: BookingSummary;
  onPress: () => void;
}

function TicketRow({ booking, onPress }: TicketRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-card bg-surface p-4 shadow-sm active:bg-surface-alt"
    >
      <View className="h-11 w-11 items-center justify-center rounded-input bg-brand-100">
        <Ionicons name="receipt-outline" size={22} color="#1FA45D" />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-heading text-base text-ink">{booking.originCity}</Text>
          <Ionicons name="arrow-forward" size={14} color="#5E6B64" />
          <Text className="font-heading text-base text-ink">{booking.destinationCity}</Text>
        </View>
        <Text className="font-body text-sm text-ink-muted">
          {booking.serviceDate} · {formatDepartureTime(booking.departureTime)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#5E6B64" />
    </Pressable>
  );
}
