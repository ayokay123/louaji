import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SuccessBurst } from "@/shared/components/illustration/SuccessBurst";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function BookingConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const bookingId = firstParam(params["bookingId"]);
  const bookingNumber = firstParam(params["bookingNumber"]);

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center justify-center gap-6 p-8">
        <SuccessBurst />

        <FadeSlideIn delay={250}>
          <View className="items-center gap-2">
            <Text className="text-center font-display text-2xl text-ink">
              {t("booking.success")}
            </Text>
            <Text className="font-body text-sm text-ink-muted">{t("booking.bookingNumber")}</Text>
            <Text className="font-heading text-xl text-brand-700">{bookingNumber}</Text>
          </View>
        </FadeSlideIn>
      </View>

      <View className="gap-3 p-5">
        <Pressable
          onPress={() => router.replace(`/ticket/${bookingId}`)}
          className="items-center rounded-input bg-brand-500 py-3.5 active:bg-brand-700"
        >
          <Text className="font-body-medium text-base text-white">{t("booking.viewTicket")}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="items-center rounded-input border border-border bg-surface py-3.5 active:bg-surface-alt"
        >
          <Text className="font-body-medium text-base text-ink">{t("booking.backHome")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
