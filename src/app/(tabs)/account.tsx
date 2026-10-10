import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile, useRoles } from "@/features/auth/hooks";
import { signOut, useSession } from "@/shared/lib/auth/session";

// Account tab. Signed-in: profile header (name/phone) + a settings menu, plus
// conditional entry points to the operator / admin spaces based on granted
// roles. Signed-out: log in / sign up CTAs instead. Identity + role data come
// from the auth feature hooks; sign-out clears the Supabase session.
export default function AccountScreen() {
  const { isAuthenticated, loading } = useSession();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-alt" edges={["top"]}>
        <ActivityIndicator color="#1FA45D" />
      </SafeAreaView>
    );
  }

  return isAuthenticated ? <AuthedAccount /> : <GuestAccount />;
}

function GuestAccount() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <View className="flex-1 justify-center gap-4 p-6">
        <Text className="text-center font-display text-2xl text-ink">{t("nav.account")}</Text>
        <Text className="text-center font-body text-base text-ink-muted">
          {t("auth.loginRequired")}
        </Text>
        <Pressable
          className="items-center rounded-input bg-brand-500 py-4 active:bg-brand-700"
          onPress={() => router.push("/(auth)/phone?mode=login")}
        >
          <Text className="font-body-medium text-base text-white">{t("auth.login")}</Text>
        </Pressable>
        <Pressable
          className="items-center rounded-input border border-border bg-surface py-4 active:bg-surface-alt"
          onPress={() => router.push("/(auth)/phone?mode=signup")}
        >
          <Text className="font-body-medium text-base text-ink">{t("auth.signup")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function AuthedAccount() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: roles } = useRoles();

  const isOperator = roles?.some((r) => r === "company_admin" || r === "driver") ?? false;
  const isAdmin = roles?.some((r) => r === "super_admin") ?? false;

  async function onLogout(): Promise<void> {
    await signOut();
    router.replace("/(auth)/welcome");
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 p-5 pb-28">
        <View className="flex-row items-center gap-4 rounded-card bg-surface p-5 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-500/15">
            <Ionicons name="person" size={26} color="#1FA45D" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-heading text-lg text-ink" numberOfLines={1}>
              {profile?.fullName ?? t("account.name")}
            </Text>
            <Text className="font-body text-sm text-ink-muted" numberOfLines={1}>
              {profile?.phone ?? ""}
            </Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-card bg-surface shadow-sm">
          <MenuRow icon="person-outline" label={t("account.personalInfo")} />
          <MenuRow icon="card-outline" label={t("account.paymentMethods")} />
          <MenuRow
            icon="notifications-outline"
            label={t("account.notifications")}
            onPress={() => router.push("/notifications")}
          />
          <MenuRow icon="help-circle-outline" label={t("account.help")} />
          <MenuRow icon="information-circle-outline" label={t("account.about")} last />
        </View>

        {isOperator || isAdmin ? (
          <View className="overflow-hidden rounded-card bg-surface shadow-sm">
            {isOperator ? (
              <MenuRow
                icon="bus-outline"
                label={t("account.operatorSpace")}
                onPress={() => router.push("/operator")}
                last={!isAdmin}
              />
            ) : null}
            {isAdmin ? (
              <MenuRow
                icon="shield-checkmark-outline"
                label={t("account.adminSpace")}
                onPress={() => router.push("/admin")}
                last
              />
            ) : null}
          </View>
        ) : null}

        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-card border border-border bg-surface py-4 active:bg-surface-alt"
          onPress={() => void onLogout()}
        >
          <Ionicons name="log-out-outline" size={20} color="#D7453B" />
          <Text className="font-body-medium text-base text-danger">{t("account.logout")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  last?: boolean;
}

function MenuRow({ icon, label, onPress, last }: MenuRowProps) {
  return (
    <Pressable
      className={`flex-row items-center gap-3 px-4 py-4 active:bg-surface-alt ${
        last ? "" : "border-b border-border"
      }`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color="#5E6B64" />
      <Text className="flex-1 text-start font-body text-base text-ink">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9AA39E" />
    </Pressable>
  );
}
