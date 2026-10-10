import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequestOtp } from "@/features/auth/hooks";
import { normalizeTunisianPhone } from "@/shared/lib/validation/phone";

// Phone entry. Signup also collects the full name (required to confirm a booking
// later). "Send code" normalizes to E.164, requests an OTP via Supabase Auth,
// then forwards to the verify screen carrying phone (+ name) as route params.
export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode, redirect } = useLocalSearchParams<{ mode?: string; redirect?: string }>();
  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const requestOtp = useRequestOtp();

  const normalized = normalizeTunisianPhone(phone);
  const nameOk = !isSignup || fullName.trim().length > 0;
  const canSubmit = normalized !== null && nameOk && !requestOtp.isPending;

  function onSubmit(): void {
    if (!normalized || !nameOk) return;
    requestOtp.mutate(normalized, {
      onSuccess: () => {
        const params: Record<string, string> = { phone: normalized };
        if (isSignup) params["fullName"] = fullName.trim();
        if (redirect) params["redirect"] = redirect;
        router.push({ pathname: "/(auth)/verify", params });
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-1 gap-6 p-6">
        <Pressable className="self-start p-1" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#1B2620" />
        </Pressable>

        <Text className="font-display text-2xl text-ink">
          {isSignup ? t("auth.signup") : t("auth.login")}
        </Text>

        <View className="gap-4">
          {isSignup ? (
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-ink-muted">{t("auth.fullName")}</Text>
              <TextInput
                className="rounded-input border border-border bg-surface px-4 py-3.5 text-start font-body text-base text-ink"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                placeholder={t("auth.fullName")}
                placeholderTextColor="#9AA39E"
              />
            </View>
          ) : null}

          <View className="gap-1.5">
            <Text className="font-body-medium text-sm text-ink-muted">{t("auth.phone")}</Text>
            <View className="flex-row items-center gap-2 rounded-input border border-border bg-surface px-4 py-3.5">
              <Text className="font-body-medium text-base text-ink-muted">+216</Text>
              <View className="h-5 w-px bg-border" />
              <TextInput
                className="flex-1 text-start font-body text-base text-ink"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={t("auth.phonePlaceholder")}
                placeholderTextColor="#9AA39E"
              />
            </View>
          </View>
        </View>

        {requestOtp.isError ? (
          <Text className="font-body text-sm text-danger">{t("common.error")}</Text>
        ) : null}

        <Pressable
          className={`mt-2 flex-row items-center justify-center rounded-input py-4 ${
            canSubmit ? "bg-brand-500 active:bg-brand-700" : "bg-brand-500/50"
          }`}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          {requestOtp.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-body-medium text-base text-white">{t("auth.sendCode")}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
