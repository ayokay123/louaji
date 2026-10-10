import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ICON_INK = "#1F2A24";

// Shared chrome for every super-admin screen: top-edge safe area, a heading row
// with an optional back affordance, and a scrolling body. Logical-direction
// classes keep it correct under RTL.
export function AdminScreen({
  title,
  showBack = false,
  children,
}: {
  title: string;
  showBack?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            className="-ms-1 size-9 items-center justify-center rounded-input active:bg-surface"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={ICON_INK} />
          </Pressable>
        ) : null}
        <Text className="font-display text-2xl text-ink">{title}</Text>
      </View>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10">{children}</ScrollView>
    </SafeAreaView>
  );
}
