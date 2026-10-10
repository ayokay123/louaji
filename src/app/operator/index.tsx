import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOperatorDashboard, useOperatorProfile } from "@/features/operators/hooks";
import { TripCard } from "@/features/trips/ui/TripCard";
import type { DashboardTrip } from "@/features/operators/core/entities/dashboard";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";

// Operator dashboard: verification banner, quick actions, today's + upcoming
// trips with occupancy. Tapping a trip opens its seat board.
export default function OperatorDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useOperatorProfile();
  const dashboard = useOperatorDashboard();

  if (profile.isLoading) {
    return <Centered>{<ActivityIndicator color="#1FA45D" />}</Centered>;
  }

  // Not yet an operator → send them to onboarding.
  if (profile.data == null) {
    return (
      <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Ionicons name="bus-outline" size={48} color="#1FA45D" />
          <Text className="text-center font-display text-xl text-ink">
            {t("operator.onboarding")}
          </Text>
          <Link href="/operator/onboard" asChild>
            <Pressable className="rounded-input bg-brand-500 px-6 py-3 active:bg-brand-700">
              <Text className="font-body-medium text-base text-white">{t("common.next")}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <FadeSlideIn>
          <Text className="font-display text-2xl text-ink">{profile.data.name}</Text>
        </FadeSlideIn>

        {!profile.data.isVerified && (
          <FadeSlideIn delay={80}>
            <View className="flex-row items-center gap-3 rounded-card bg-warning/15 p-4">
              <Ionicons name="alert-circle-outline" size={22} color="#B7791F" />
              <Text className="flex-1 font-body text-sm text-ink">{t("operator.notVerified")}</Text>
            </View>
          </FadeSlideIn>
        )}

        <View className="flex-row gap-3">
          <QuickAction
            icon="add-circle-outline"
            label={t("operator.scheduleTrip")}
            href="/operator/schedule"
          />
          <QuickAction icon="car-outline" label={t("operator.fleet")} href="/operator/fleet" />
        </View>

        <Section title={t("operator.todayTrips")}>
          {dashboard.isLoading ? (
            <ActivityIndicator color="#1FA45D" />
          ) : (
            <TripList
              trips={dashboard.data?.todayTrips ?? []}
              onPress={(id) => router.push(`/operator/trip/${id}`)}
              empty={t("common.empty")}
            />
          )}
        </Section>

        <Section title={t("operator.upcomingTrips")}>
          <TripList
            trips={dashboard.data?.upcomingTrips ?? []}
            onPress={(id) => router.push(`/operator/trip/${id}`)}
            empty={t("common.empty")}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function TripList({
  trips,
  onPress,
  empty,
}: {
  trips: DashboardTrip[];
  onPress: (id: string) => void;
  empty: string;
}) {
  if (trips.length === 0) {
    return <Text className="font-body text-sm text-ink-muted">{empty}</Text>;
  }
  return (
    <View className="gap-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onPress={() => onPress(trip.id)} />
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-heading text-lg text-ink">{title}</Text>
      {children}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: "/operator/schedule" | "/operator/fleet";
}) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 items-center gap-2 rounded-card bg-surface p-4 shadow-sm active:opacity-90">
        <Ionicons name={icon} size={26} color="#1FA45D" />
        <Text className="text-center font-body-medium text-sm text-ink">{label}</Text>
      </Pressable>
    </Link>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <View className="flex-1 items-center justify-center">{children}</View>
    </SafeAreaView>
  );
}
