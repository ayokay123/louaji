import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DayChips, DepartureCard } from "@/features/booking/ui";
import { useSearchTrips } from "@/features/booking/hooks";
import { todayServiceDate } from "@/shared/lib/datetime";
import { LouageHero } from "@/shared/components/illustration/LouageHero";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ResultsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const originCityId = firstParam(params["originCityId"]);
  const destinationCityId = firstParam(params["destinationCityId"]);
  const originName = firstParam(params["originName"]);
  const destinationName = firstParam(params["destinationName"]);
  const initialDate = firstParam(params["serviceDate"]) || todayServiceDate();

  const [serviceDate, setServiceDate] = useState<string>(initialDate);

  const query =
    originCityId && destinationCityId ? { originCityId, destinationCityId, serviceDate } : null;
  const { data: trips, isLoading, error } = useSearchTrips(query);

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="gap-4 p-5 pb-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="rounded-input p-1 active:bg-border"
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="arrow-back" size={24} color="#1C2420" />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Text className="font-display text-xl text-ink">{originName}</Text>
            <Ionicons name="arrow-forward" size={18} color="#5E6B64" />
            <Text className="font-display text-xl text-ink">{destinationName}</Text>
          </View>
        </View>

        <DayChips baseDate={initialDate} selectedDate={serviceDate} onSelect={setServiceDate} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-5">
          <Text className="font-body text-base text-danger">{t("common.error")}</Text>
        </View>
      ) : (
        <FlatList
          data={trips ?? []}
          keyExtractor={(trip) => trip.id}
          contentContainerClassName="gap-3 px-5 pb-8"
          ListHeaderComponent={
            <Text className="pb-1 font-body text-sm text-ink-muted">
              {t("results.available", { count: trips?.length ?? 0 })}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center gap-3 py-12">
              <LouageHero width={180} />
              <Text className="font-body text-base text-ink-muted">{t("results.none")}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeSlideIn delay={Math.min(index, 6) * 60}>
              <DepartureCard trip={item} onPress={(id) => router.push(`/trip/${id}`)} />
            </FadeSlideIn>
          )}
        />
      )}
    </SafeAreaView>
  );
}
