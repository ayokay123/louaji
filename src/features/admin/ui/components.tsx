import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

const ICON_INK = "#1F2A24";
const PLACEHOLDER = "#90A096";

// Small, token-only building blocks shared across the admin screens. Kept here
// so each screen file stays focused and well under the size budget.

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-ink-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        keyboardType={keyboardType ?? "default"}
        className="rounded-input border border-border bg-surface px-3.5 py-3 font-body text-base text-ink"
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      className={`min-h-12 items-center justify-center rounded-input py-3.5 ${
        isDisabled ? "bg-brand-500/60" : "bg-brand-500 active:bg-brand-700"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="font-body-medium text-base text-white">{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text className="mt-2 font-heading text-lg text-ink">{children}</Text>;
}

export function StatusPill({ tone, label }: { tone: "success" | "warning"; label: string }) {
  const bg = tone === "success" ? "bg-success/15" : "bg-warning/15";
  const text = tone === "success" ? "text-success" : "text-warning";
  return (
    <View className={`self-start rounded-input px-2.5 py-1 ${bg}`}>
      <Text className={`font-body-medium text-xs ${text}`}>{label}</Text>
    </View>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <View className="items-center gap-2 rounded-card bg-surface p-8">
      <Ionicons name="file-tray-outline" size={28} color={PLACEHOLDER} />
      <Text className="font-body text-base text-ink-muted">{label}</Text>
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="items-center py-10">
      <ActivityIndicator color={ICON_INK} />
    </View>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <View className="rounded-card border border-danger/30 bg-danger/10 p-4">
      <Text className="font-body text-base text-danger">{label}</Text>
    </View>
  );
}
