import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequestOtp, useVerifyOtp, type VerifyOtpInput } from "@/features/auth/hooks";

const CODE_LENGTH = 6;

// OTP verification. Takes the 6-digit SMS code, verifies via Supabase Auth, and
// (on success) the hook syncs the public.users row before we drop the user into
// the tabs. Resend re-requests a code for the same phone.
export default function VerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone, fullName, redirect } = useLocalSearchParams<{
    phone?: string;
    fullName?: string;
    redirect?: string;
  }>();

  const [code, setCode] = useState("");
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();

  const canSubmit = code.length === CODE_LENGTH && !!phone && !verifyOtp.isPending;

  function onVerify(): void {
    if (!phone || code.length !== CODE_LENGTH) return;
    const input: VerifyOtpInput = { phone, token: code };
    if (fullName) input.fullName = fullName;
    verifyOtp.mutate(input, {
      onSuccess: () =>
        router.replace((redirect ?? "/(tabs)") as Parameters<typeof router.replace>[0]),
    });
  }

  function onResend(): void {
    if (!phone) return;
    requestOtp.mutate(phone);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-1 gap-6 p-6">
        <Pressable className="self-start p-1" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#1B2620" />
        </Pressable>

        <View className="gap-2">
          <Text className="font-display text-2xl text-ink">{t("auth.verifyCode")}</Text>
          <Text className="font-body text-base text-ink-muted">{t("auth.enterCode")}</Text>
          {phone ? <Text className="font-body-medium text-base text-ink">{phone}</Text> : null}
        </View>

        <TextInput
          className="rounded-input border border-border bg-surface px-4 py-4 text-center font-display text-2xl tracking-[8px] text-ink"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          placeholder="••••••"
          placeholderTextColor="#9AA39E"
        />

        {verifyOtp.isError ? (
          <Text className="font-body text-sm text-danger">{t("auth.invalidCode")}</Text>
        ) : null}

        <Pressable
          className={`mt-2 flex-row items-center justify-center rounded-input py-4 ${
            canSubmit ? "bg-brand-500 active:bg-brand-700" : "bg-brand-500/50"
          }`}
          disabled={!canSubmit}
          onPress={onVerify}
        >
          {verifyOtp.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-body-medium text-base text-white">{t("common.confirm")}</Text>
          )}
        </Pressable>

        <Pressable className="items-center py-2" disabled={requestOtp.isPending} onPress={onResend}>
          <Text className="font-body-medium text-base text-brand-500">{t("auth.resendCode")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
