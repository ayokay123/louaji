import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCities } from "@/features/catalog/hooks";
import type { City } from "@/features/catalog/core/entities";
import { CityPicker } from "@/features/booking/ui";
import { addServiceDays, todayServiceDate } from "@/shared/lib/datetime";
import { LouageHero } from "@/shared/components/illustration/LouageHero";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";

// Home / search — origin + destination city pickers, date (defaults to today),
// swap, and a Search CTA that routes to the results screen. See docs/SRS.md §2.2.
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: cities } = useCities();

  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [serviceDate, setServiceDate] = useState<string>(todayServiceDate());
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);

  const cityList = useMemo(() => cities ?? [], [cities]);
  // Can't search the past — a louage departed yesterday can't be booked, and the
  // search query already hides departed trips (eng review B12).
  const atToday = serviceDate <= todayServiceDate();
  const sameCity = origin !== null && destination !== null && origin.id === destination.id;
  const canSearch = origin !== null && destination !== null && !sameCity;

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function search() {
    if (!canSearch || origin === null || destination === null) return;
    router.push({
      pathname: "/results",
      params: {
        originCityId: origin.id,
        destinationCityId: destination.id,
        serviceDate,
        originName: origin.name,
        destinationName: destination.name,
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-28">
        <View className="gap-5 p-5">
          <FadeSlideIn>
            <View className="gap-1">
              <Text className="font-body text-base text-ink-muted">{t("home.greeting")} 👋</Text>
              <Text className="font-display text-2xl text-ink">{t("home.prompt")}</Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={80}>
            <View className="items-center">
              <LouageHero width={260} />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={160}>
            <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
              <SearchRow
                icon="location-outline"
                label={origin?.name ?? t("common.from")}
                filled={origin !== null}
                onPress={() => setPicker("origin")}
              />
              <View className="flex-row items-center">
                <View className="h-px flex-1 bg-border" />
                <Pressable
                  onPress={swap}
                  className="mx-2 rounded-input bg-brand-100 p-2 active:bg-brand-300"
                  accessibilityLabel={t("home.swap")}
                >
                  <Ionicons name="swap-vertical" size={18} color="#1FA45D" />
                </Pressable>
                <View className="h-px flex-1 bg-border" />
              </View>
              <SearchRow
                icon="flag-outline"
                label={destination?.name ?? t("common.to")}
                filled={destination !== null}
                onPress={() => setPicker("destination")}
              />
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between py-1.5">
                <View className="flex-row items-center gap-3">
                  <Ionicons name="calendar-outline" size={20} color="#1FA45D" />
                  <Text className="font-body-medium text-base text-ink">{serviceDate}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Pressable
                    disabled={atToday}
                    onPress={() => setServiceDate((d) => addServiceDays(d, -1))}
                    accessibilityLabel={t("home.prevDay")}
                    className={`rounded-input p-2 ${atToday ? "opacity-30" : "active:bg-brand-100"}`}
                  >
                    <Ionicons name="chevron-back" size={20} color="#1FA45D" />
                  </Pressable>
                  <Pressable
                    onPress={() => setServiceDate((d) => addServiceDays(d, 1))}
                    accessibilityLabel={t("home.nextDay")}
                    className="rounded-input p-2 active:bg-brand-100"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#1FA45D" />
                  </Pressable>
                </View>
              </View>

              {sameCity ? (
                <Text className="font-body text-sm text-danger">{t("home.selectDestination")}</Text>
              ) : null}

              <Pressable
                disabled={!canSearch}
                onPress={search}
                className={`mt-1 items-center rounded-input py-3.5 ${
                  canSearch ? "bg-brand-500 active:bg-brand-700" : "bg-brand-300"
                }`}
              >
                <Text className="font-body-medium text-base text-white">{t("common.search")}</Text>
              </Pressable>
            </View>
          </FadeSlideIn>

          <Text className="font-heading text-lg text-ink">{t("home.recentSearches")}</Text>
        </View>
      </ScrollView>

      <CityPicker
        visible={picker === "origin"}
        title={t("home.selectOrigin")}
        cities={cityList}
        excludeId={destination?.id}
        onSelect={(city) => {
          setOrigin(city);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <CityPicker
        visible={picker === "destination"}
        title={t("home.selectDestination")}
        cities={cityList}
        excludeId={origin?.id}
        onSelect={(city) => {
          setDestination(city);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

interface SearchRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  filled: boolean;
  onPress: () => void;
}

function SearchRow({ icon, label, filled, onPress }: SearchRowProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-1.5 active:opacity-70">
      <Ionicons name={icon} size={20} color="#1FA45D" />
      <Text className={`font-body text-base ${filled ? "text-ink" : "text-ink-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
