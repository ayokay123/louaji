import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusChip } from "@/features/booking/ui";
import { useBooking } from "@/features/booking/hooks";
import { formatDepartureTime } from "@/shared/lib/datetime";
import { formatMillimes } from "@/shared/lib/money";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function TicketScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = firstParam(params["id"]);

  const { data: booking, isLoading, error } = useBooking(bookingId);

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
        <Text className="font-display text-xl text-ink">{t("nav.tickets")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      ) : error || !booking ? (
        <View className="flex-1 items-center justify-center p-5">
          <Text className="font-body text-base text-danger">{t("common.error")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-5 pt-2">
          <FadeSlideIn>
            <View className="overflow-hidden rounded-card bg-surface shadow-sm">
              <View className="items-center gap-2 bg-brand-500 p-5">
                <Ionicons name="bus-outline" size={28} color="#FFFFFF" />
                <Text className="font-body text-xs text-white">{t("booking.bookingNumber")}</Text>
                <Text className="font-display text-xl text-white">{booking.bookingNumber}</Text>
              </View>

              <View className="gap-4 p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-display text-xl text-ink">{booking.originCity}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#5E6B64" />
                    <Text className="font-display text-xl text-ink">{booking.destinationCity}</Text>
                  </View>
                  <StatusChip status={booking.status} />
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row flex-wrap gap-x-8 gap-y-4">
                  <Detail
                    icon="calendar-outline"
                    label={t("common.date")}
                    value={booking.serviceDate}
                  />
                  <Detail
                    icon="time-outline"
                    label={t("trip.departure")}
                    value={formatDepartureTime(booking.departureTime)}
                  />
                  <Detail
                    icon="business-outline"
                    label={t("trip.operator")}
                    value={booking.operatorName}
                  />
                  <Detail
                    icon="people-outline"
                    label={t("common.seats")}
                    value={booking.seatNumbers.join(", ")}
                  />
                  <Detail
                    icon="person-outline"
                    label={t("booking.fullName")}
                    value={booking.passengerName}
                  />
                  <Detail
                    icon="cash-outline"
                    label={t("common.total")}
                    value={formatMillimes(booking.totalMillimes)}
                  />
                </View>
              </View>
            </View>
          </FadeSlideIn>
        </ScrollView>
      )}
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
