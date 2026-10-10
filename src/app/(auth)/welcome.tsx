import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Welcome / intro splash. Brand wordmark + tagline, then the three entry points:
// log in, sign up, or skip straight into browsing as a guest. Booking later
// gates on a session, so skipping is fine for search/results. See docs/SRS.md §2.1.
// An optional `redirect` param (set when a guest hits a sign-in gate, e.g. seat
// checkout) is forwarded through the flow so we return there after verifying.
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const redirectParam: Record<string, string> = redirect ? { redirect } : {};

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-1 justify-between p-6">
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="font-display text-5xl text-brand-500">Louaji</Text>
          <Text className="text-center font-heading text-lg text-ink-muted">
            {t("auth.welcome")}
          </Text>
        </View>

        <View className="gap-3">
          <Pressable
            className="items-center rounded-input bg-brand-500 py-4 active:bg-brand-700"
            onPress={() =>
              router.push({
                pathname: "/(auth)/phone",
                params: { mode: "login", ...redirectParam },
              })
            }
          >
            <Text className="font-body-medium text-base text-white">{t("auth.login")}</Text>
          </Pressable>

          <Pressable
            className="items-center rounded-input border border-border bg-surface py-4 active:bg-surface-alt"
            onPress={() =>
              router.push({
                pathname: "/(auth)/phone",
                params: { mode: "signup", ...redirectParam },
              })
            }
          >
            <Text className="font-body-medium text-base text-ink">{t("auth.signup")}</Text>
          </Pressable>

          <Pressable className="items-center py-3" onPress={() => router.replace("/(tabs)")}>
            <Text className="font-body text-base text-ink-muted">{t("auth.skip")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
