import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConfirmBooking, useTripDetail } from "@/features/booking/hooks";
import { ApiError } from "@/shared/lib/http/client";
import { AnimatedPrice } from "@/shared/components/motion/AnimatedPrice";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";
import { useSession } from "@/shared/lib/auth/session";
import { formatDepartureTime } from "@/shared/lib/datetime";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseSeatNumbers(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export default function BookingSummaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session, isAuthenticated } = useSession();

  const tripId = firstParam(params["tripId"]);
  const seatNumbers = parseSeatNumbers(firstParam(params["seatNumbers"]));

  const { data: trip, isLoading } = useTripDetail(tripId);
  const confirm = useConfirmBooking();

  const metadata = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const prefillName = typeof metadata["full_name"] === "string" ? metadata["full_name"] : "";
  const prefillPhone = session?.user.phone ?? "";

  const [name, setName] = useState<string>(prefillName);
  const [phone, setPhone] = useState<string>(prefillPhone);

  const total = trip ? trip.priceMillimes * seatNumbers.length : 0;
  const canConfirm = name.trim().length > 0 && phone.trim().length > 0 && !confirm.isPending;

  async function submit() {
    if (!canConfirm) return;
    // Confirming a booking requires a signed-in passenger (docs/SRS.md §2.1).
    // Guests are sent to sign in rather than hitting a 401.
    if (!isAuthenticated) {
      router.push("/(auth)/welcome");
      return;
    }
    try {
      const res = await confirm.mutateAsync({
        tripId,
        seatNumbers,
        passengerName: name.trim(),
        passengerPhone: phone.trim(),
      });
      router.push({
        pathname: "/booking/confirmation",
        params: {
          bookingId: res.booking.id,
          bookingNumber: res.booking.bookingNumber,
        },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.tag === "HoldExpired") {
        Alert.alert(t("booking.holdExpired"));
        router.back();
      } else {
        Alert.alert(t("common.error"));
      }
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-alt" edges={["top"]}>
        <ActivityIndicator color="#1FA45D" />
      </SafeAreaView>
    );
  }

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
        <Text className="font-display text-xl text-ink">{t("booking.summary")}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5 pt-2 pb-8">
        {trip ? (
          <FadeSlideIn>
            <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
              <View className="flex-row items-center gap-2">
                <Text className="font-heading text-base text-ink">{trip.originCity}</Text>
                <Ionicons name="arrow-forward" size={16} color="#5E6B64" />
                <Text className="font-heading text-base text-ink">{trip.destinationCity}</Text>
              </View>
              <Text className="font-body text-sm text-ink-muted">
                {trip.serviceDate} · {formatDepartureTime(trip.departureTime)}
              </Text>
              <View className="h-px bg-border" />
              <Row label={t("common.seats")} value={seatNumbers.join(", ")} />
              <Row label={t("booking.paymentMethod")} value={t("booking.cashOnBoarding")} />
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between">
                <Text className="font-heading text-base text-ink">{t("common.total")}</Text>
                <AnimatedPrice millimes={total} className="font-display text-lg text-brand-700" />
              </View>
            </View>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={80}>
          <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
            <Text className="font-heading text-lg text-ink">{t("booking.details")}</Text>
            <Field
              label={t("booking.fullName")}
              value={name}
              onChangeText={setName}
              placeholder={t("booking.fullName")}
            />
            <Field
              label={t("booking.phone")}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("booking.phone")}
              keyboardType="phone-pad"
            />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={160}>
          <Pressable
            disabled={!canConfirm}
            onPress={submit}
            className={`items-center rounded-input py-3.5 ${
              canConfirm ? "bg-brand-500 active:bg-brand-700" : "bg-brand-300"
            }`}
          >
            <Text className="font-body-medium text-base text-white">{t("booking.confirm")}</Text>
          </Pressable>
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-body text-sm text-ink-muted">{label}</Text>
      <Text className="font-body-medium text-sm text-ink">{value}</Text>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "phone-pad";
}

function Field({ label, value, placeholder, onChangeText, keyboardType = "default" }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="font-body text-sm text-ink-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5E6B64"
        keyboardType={keyboardType}
        className="rounded-input border border-border bg-surface px-4 py-3 font-body text-base text-ink"
      />
    </View>
  );
}
