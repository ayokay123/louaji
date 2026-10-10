import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import type { AdminCity } from "@/features/admin/core/entities";
import { useAdminCities, useAdminRoutes, useCreateRoute } from "@/features/admin/hooks";
import { AdminScreen } from "@/features/admin/ui/AdminScreen";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SectionTitle,
} from "@/features/admin/ui/components";

const ICON_BRAND = "#1FA45D";

// Routes: list directional origin→destination pairs and add a new one by
// picking two distinct cities from the catalog.
export default function AdminRoutesScreen() {
  const { t } = useTranslation();
  const cities = useAdminCities();
  const routes = useAdminRoutes();
  const createRoute = useCreateRoute();

  const [originId, setOriginId] = useState<string | null>(null);
  const [destId, setDestId] = useState<string | null>(null);

  const cityList = cities.data ?? [];
  const canSubmit =
    originId !== null && destId !== null && originId !== destId && !createRoute.isPending;

  const onAdd = () => {
    if (!canSubmit || originId === null || destId === null) return;
    createRoute.mutate(
      { originCityId: originId, destinationCityId: destId },
      {
        onSuccess: () => {
          setOriginId(null);
          setDestId(null);
        },
      },
    );
  };

  return (
    <AdminScreen title={t("admin.routes")} showBack>
      <Card>
        <SectionTitle>{t("admin.addRoute")}</SectionTitle>
        <CityPicker
          label={t("common.from")}
          cities={cityList}
          selectedId={originId}
          excludeId={destId}
          onSelect={setOriginId}
        />
        <CityPicker
          label={t("common.to")}
          cities={cityList}
          selectedId={destId}
          excludeId={originId}
          onSelect={setDestId}
        />
        {createRoute.isError ? <ErrorState label={t("common.error")} /> : null}
        <PrimaryButton
          label={t("admin.addRoute")}
          onPress={onAdd}
          loading={createRoute.isPending}
          disabled={!canSubmit}
        />
      </Card>

      <SectionTitle>{t("admin.routes")}</SectionTitle>
      {routes.isLoading ? (
        <LoadingState />
      ) : routes.isError ? (
        <ErrorState label={t("common.error")} />
      ) : !routes.data || routes.data.length === 0 ? (
        <EmptyState label={t("common.empty")} />
      ) : (
        <View className="gap-2">
          {routes.data.map((route) => (
            <View
              key={route.id}
              className="flex-row items-center gap-2 rounded-card bg-surface p-4 shadow-sm"
            >
              <Text className="font-body-medium text-base text-ink">{route.originCity}</Text>
              <Ionicons name="arrow-forward" size={16} color={ICON_BRAND} />
              <Text className="font-body-medium text-base text-ink">{route.destinationCity}</Text>
            </View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

function CityPicker({
  label,
  cities,
  selectedId,
  excludeId,
  onSelect,
}: {
  label: string;
  cities: AdminCity[];
  selectedId: string | null;
  excludeId: string | null;
  onSelect: (id: string) => void;
}) {
  const options = cities.filter((c) => c.id !== excludeId);
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-ink-muted">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((city) => {
          const active = city.id === selectedId;
          return (
            <Pressable
              key={city.id}
              onPress={() => onSelect(city.id)}
              accessibilityRole="button"
              className={`rounded-input border px-3 py-2 ${
                active ? "border-brand-500 bg-brand-500/10" : "border-border bg-surface"
              }`}
            >
              <Text
                className={`font-body-medium text-sm ${active ? "text-brand-700" : "text-ink"}`}
              >
                {city.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
