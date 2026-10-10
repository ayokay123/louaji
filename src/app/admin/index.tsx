import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { AdminScreen } from "@/features/admin/ui/AdminScreen";
import { FadeSlideIn } from "@/shared/components/motion/FadeSlideIn";
import {
  useAdminCities,
  useAdminRoutes,
  useAdminUsers,
  usePendingOperators,
} from "@/features/admin/hooks";

const ICON_BRAND = "#1FA45D";

interface QuickLink {
  href: "/admin/cities" | "/admin/routes" | "/admin/operators" | "/admin/users";
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  count: number | undefined;
  pending?: boolean;
}

// Super-admin overview: live counts for each catalog/operator/user area plus
// quick links into the management screens.
export default function AdminOverviewScreen() {
  const { t } = useTranslation();
  const cities = useAdminCities();
  const routes = useAdminRoutes();
  const operators = usePendingOperators();
  const users = useAdminUsers();

  const links: QuickLink[] = [
    {
      href: "/admin/cities",
      icon: "business-outline",
      labelKey: "admin.cities",
      count: cities.data?.length,
    },
    {
      href: "/admin/routes",
      icon: "git-network-outline",
      labelKey: "admin.routes",
      count: routes.data?.length,
    },
    {
      href: "/admin/operators",
      icon: "shield-checkmark-outline",
      labelKey: "admin.operators",
      count: operators.data?.length,
      pending: true,
    },
    {
      href: "/admin/users",
      icon: "people-outline",
      labelKey: "admin.users",
      count: users.data?.length,
    },
  ];

  return (
    <AdminScreen title={t("admin.title")}>
      <View className="gap-3">
        {links.map((link, i) => (
          <FadeSlideIn key={link.href} delay={i * 60}>
            <Link href={link.href} asChild>
              <Pressable className="flex-row items-center gap-4 rounded-card bg-surface p-4 shadow-sm active:bg-surface-alt">
                <View className="size-11 items-center justify-center rounded-input bg-brand-500/10">
                  <Ionicons name={link.icon} size={22} color={ICON_BRAND} />
                </View>
                <View className="flex-1">
                  <Text className="font-heading text-lg text-ink">{t(link.labelKey)}</Text>
                  {link.count !== undefined ? (
                    <Text className="font-body text-sm text-ink-muted">
                      {link.pending
                        ? `${link.count} ${t("admin.pending").toLowerCase()}`
                        : String(link.count)}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#90A096" />
              </Pressable>
            </Link>
          </FadeSlideIn>
        ))}
      </View>
    </AdminScreen>
  );
}
