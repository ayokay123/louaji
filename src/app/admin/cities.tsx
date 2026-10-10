import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useAdminCities, useCreateCity } from "@/features/admin/hooks";
import { AdminScreen } from "@/features/admin/ui/AdminScreen";
import {
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PrimaryButton,
  SectionTitle,
  StatusPill,
} from "@/features/admin/ui/components";

// Catalog cities: list every city (active + inactive) and add a new one. The
// name (ar) is required; fr/en/governorate are optional. The `location`
// PostGIS column is left null on create (handled server-side).
export default function AdminCitiesScreen() {
  const { t } = useTranslation();
  const cities = useAdminCities();
  const createCity = useCreateCity();

  const [name, setName] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [governorate, setGovernorate] = useState("");

  const canSubmit = name.trim().length > 0 && !createCity.isPending;

  const onAdd = () => {
    if (!canSubmit) return;
    const trimmedFr = nameFr.trim();
    const trimmedEn = nameEn.trim();
    const trimmedGov = governorate.trim();
    createCity.mutate(
      {
        name: name.trim(),
        ...(trimmedFr ? { nameFr: trimmedFr } : {}),
        ...(trimmedEn ? { nameEn: trimmedEn } : {}),
        ...(trimmedGov ? { governorate: trimmedGov } : {}),
      },
      {
        onSuccess: () => {
          setName("");
          setNameFr("");
          setNameEn("");
          setGovernorate("");
        },
      },
    );
  };

  return (
    <AdminScreen title={t("admin.cities")} showBack>
      <Card>
        <SectionTitle>{t("admin.addCity")}</SectionTitle>
        <Field label={t("admin.cityName")} value={name} onChangeText={setName} />
        <Field label="Nom (FR)" value={nameFr} onChangeText={setNameFr} />
        <Field label="Name (EN)" value={nameEn} onChangeText={setNameEn} />
        <Field label={t("admin.governorate")} value={governorate} onChangeText={setGovernorate} />
        {createCity.isError ? <ErrorState label={t("common.error")} /> : null}
        <PrimaryButton
          label={t("admin.addCity")}
          onPress={onAdd}
          loading={createCity.isPending}
          disabled={!canSubmit}
        />
      </Card>

      <SectionTitle>{t("admin.cities")}</SectionTitle>
      {cities.isLoading ? (
        <LoadingState />
      ) : cities.isError ? (
        <ErrorState label={t("common.error")} />
      ) : !cities.data || cities.data.length === 0 ? (
        <EmptyState label={t("common.empty")} />
      ) : (
        <View className="gap-2">
          {cities.data.map((city) => (
            <View
              key={city.id}
              className="flex-row items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm"
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-body-medium text-base text-ink">{city.name}</Text>
                {city.governorate ? (
                  <Text className="font-body text-sm text-ink-muted">{city.governorate}</Text>
                ) : null}
              </View>
              <StatusPill
                tone={city.isActive ? "success" : "warning"}
                label={city.isActive ? t("admin.verified") : t("admin.pending")}
              />
            </View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}
