import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/shared/lib/http/client";
import { useOnboardOperator } from "@/features/operators/hooks";
import type { OperatorKind } from "@/features/operators/core/entities/operator";

// Operator onboarding: choose company vs independent driver, enter a name + an
// optional phone, submit. On success we return to the dashboard.
export default function OnboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const onboard = useOnboardOperator();

  const [kind, setKind] = useState<OperatorKind>("company");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    onboard.mutate(
      {
        kind,
        companyName: kind === "company" ? name.trim() : null,
        fullName: kind === "driver" ? name.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
      },
      {
        onSuccess: () => router.replace("/operator"),
        onError: (err) => setError(err instanceof ApiError ? err.message : t("common.error")),
      },
    );
  };

  const canSubmit = name.trim().length >= 2 && !onboard.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <View className="flex-row gap-3">
          <KindToggle
            active={kind === "company"}
            label={t("operator.companyName")}
            onPress={() => setKind("company")}
          />
          <KindToggle
            active={kind === "driver"}
            label={t("operator.independentDriver")}
            onPress={() => setKind("driver")}
          />
        </View>

        <Field
          label={kind === "company" ? t("operator.companyName") : t("auth.fullName")}
          value={name}
          onChangeText={setName}
          placeholder={kind === "company" ? t("operator.companyName") : t("auth.fullName")}
        />
        <Field
          label={t("auth.phone")}
          value={phone}
          onChangeText={setPhone}
          placeholder={t("auth.phonePlaceholder")}
          keyboardType="phone-pad"
        />

        {error && <Text className="font-body text-sm text-danger">{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={`items-center rounded-input py-3.5 ${canSubmit ? "bg-brand-500 active:bg-brand-700" : "bg-brand-100"}`}
        >
          {onboard.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-body-medium text-base text-white">{t("common.confirm")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function KindToggle({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-card border p-4 ${active ? "border-brand-500 bg-brand-100" : "border-border bg-surface"}`}
    >
      <Text className={`font-body-medium text-sm ${active ? "text-brand-700" : "text-ink-muted"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-ink">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA8A0"
        keyboardType={keyboardType ?? "default"}
        className="rounded-input border border-border bg-surface px-4 py-3 font-body text-base text-ink"
      />
    </View>
  );
}
