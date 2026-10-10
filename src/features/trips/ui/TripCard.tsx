import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { formatMillimes } from "@/shared/lib/money";

// A compact card summarizing one operator trip: route, time, price, occupancy.
// Used on the dashboard and the trips list. `onPress` opens the seat board.

export interface TripCardData {
  originCity: string;
  destinationCity: string;
  departureTime: string;
  estArrivalTime: string | null;
  status: string;
  priceMillimes: number;
  totalSeats: number;
  bookedSeats: number;
  vehiclePlate?: string;
}

interface TripCardProps {
  trip: TripCardData;
  onPress?: () => void;
}

interface StatusTone {
  bg: string;
  text: string;
  label: string;
}

const STATUS_TONE: Record<string, StatusTone> = {
  scheduled: { bg: "bg-brand-100", text: "text-brand-700", label: "booking.statusConfirmed" },
  boarding: { bg: "bg-warning/20", text: "text-ink", label: "booking.statusConfirmed" },
  departed: { bg: "bg-surface-alt", text: "text-ink-muted", label: "booking.statusBoarded" },
  completed: { bg: "bg-success/20", text: "text-ink", label: "booking.statusBoarded" },
  cancelled: { bg: "bg-danger/15", text: "text-danger", label: "booking.statusCancelled" },
};

const FALLBACK_TONE: StatusTone = {
  bg: "bg-surface-alt",
  text: "text-ink-muted",
  label: "booking.statusConfirmed",
};

export function TripCard({ trip, onPress }: TripCardProps) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[trip.status] ?? FALLBACK_TONE;
  const occupancy =
    trip.totalSeats > 0 ? Math.round((trip.bookedSeats / trip.totalSeats) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      className="gap-3 rounded-card bg-surface p-4 shadow-sm active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="font-heading text-base text-ink" numberOfLines={1}>
            {trip.originCity}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#5E6B64" />
          <Text className="font-heading text-base text-ink" numberOfLines={1}>
            {trip.destinationCity}
          </Text>
        </View>
        <View className={`rounded-input px-2 py-1 ${tone.bg}`}>
          <Text className={`font-body-medium text-xs ${tone.text}`}>{t(tone.label)}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={16} color="#5E6B64" />
          <Text className="font-body text-sm text-ink-muted">
            {trip.departureTime}
            {trip.estArrivalTime ? ` – ${trip.estArrivalTime}` : ""}
          </Text>
        </View>
        <Text className="font-body-medium text-sm text-ink">
          {formatMillimes(trip.priceMillimes)}
        </Text>
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-xs text-ink-muted">{t("operator.occupancy")}</Text>
          <Text className="font-body-medium text-xs text-ink">
            {trip.bookedSeats}/{trip.totalSeats} ({occupancy}%)
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-seat bg-surface-alt">
          <View className="h-full rounded-seat bg-brand-500" style={{ width: `${occupancy}%` }} />
        </View>
      </View>
    </Pressable>
  );
}
