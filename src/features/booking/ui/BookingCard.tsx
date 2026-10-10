import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { formatDepartureTime } from "@/shared/lib/datetime";
import { formatMillimes } from "@/shared/lib/money";
import type { BookingSummary } from "../core/entities/booking";
import { StatusChip } from "./StatusChip";

interface BookingCardProps {
  booking: BookingSummary;
  onPress: (bookingId: string) => void;
  onCancel?: ((bookingId: string) => void) | undefined;
}

export function BookingCard({ booking, onPress, onCancel }: BookingCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress(booking.id)}
      className="gap-3 rounded-card bg-surface p-4 shadow-sm active:bg-surface-alt"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-heading text-base text-ink">{booking.originCity}</Text>
          <Ionicons name="arrow-forward" size={16} color="#5E6B64" />
          <Text className="font-heading text-base text-ink">{booking.destinationCity}</Text>
        </View>
        <StatusChip status={booking.status} />
      </View>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color="#5E6B64" />
          <Text className="font-body text-sm text-ink-muted">{booking.serviceDate}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={15} color="#5E6B64" />
          <Text className="font-body text-sm text-ink-muted">
            {formatDepartureTime(booking.departureTime)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="people-outline" size={15} color="#5E6B64" />
          <Text className="font-body text-sm text-ink-muted">
            {t("common.seats")}: {booking.seatNumbers.join(", ")}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="font-body text-sm text-ink-muted">{booking.operatorName}</Text>
        <Text className="font-heading text-base text-brand-700">
          {formatMillimes(booking.totalMillimes)}
        </Text>
      </View>

      {onCancel ? (
        <Pressable
          onPress={() => onCancel(booking.id)}
          className="mt-1 items-center rounded-input border border-danger py-2.5 active:bg-surface-alt"
        >
          <Text className="font-body-medium text-sm text-danger">{t("booking.cancelBooking")}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
