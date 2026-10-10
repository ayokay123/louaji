import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { formatMillimes } from "@/shared/lib/money";
import { formatDepartureTime } from "@/shared/lib/datetime";
import type { SearchResultTrip } from "../core/entities/trip";

interface DepartureCardProps {
  trip: SearchResultTrip;
  onPress: (tripId: string) => void;
}

export function DepartureCard({ trip, onPress }: DepartureCardProps) {
  const { t } = useTranslation();
  const soldOut = trip.availableSeats <= 0;

  return (
    <Pressable
      onPress={() => onPress(trip.id)}
      className="gap-3 rounded-card bg-surface p-4 shadow-sm active:bg-surface-alt"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={18} color="#1FA45D" />
          <Text className="font-display text-xl text-ink">
            {formatDepartureTime(trip.departureTime)}
          </Text>
          {trip.estArrivalTime ? (
            <Text className="font-body text-sm text-ink-muted">
              → {formatDepartureTime(trip.estArrivalTime)}
            </Text>
          ) : null}
        </View>
        <Text className="font-heading text-lg text-brand-700">
          {formatMillimes(trip.priceMillimes)}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Ionicons
          name={trip.operator.isCompany ? "business-outline" : "person-outline"}
          size={16}
          color="#5E6B64"
        />
        <Text className="font-body text-sm text-ink-muted">{trip.operator.name}</Text>
      </View>

      <View className="h-px bg-border" />

      <View className="flex-row items-center gap-2">
        <Ionicons name="people-outline" size={16} color={soldOut ? "#D7453B" : "#1FA45D"} />
        <Text className={`font-body-medium text-sm ${soldOut ? "text-danger" : "text-ink"}`}>
          {soldOut
            ? t("results.soldOut")
            : t("results.seatsAvailable", { count: trip.availableSeats })}
        </Text>
      </View>
    </Pressable>
  );
}
