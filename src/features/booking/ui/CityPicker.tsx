import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { City } from "@/features/catalog/core/entities";

interface CityPickerProps {
  visible: boolean;
  title: string;
  cities: City[];
  /** City id to disable (e.g. the already-chosen counterpart). */
  excludeId?: string | undefined;
  onSelect: (city: City) => void;
  onClose: () => void;
}

export function CityPicker({
  visible,
  title,
  cities,
  excludeId,
  onSelect,
  onClose,
}: CityPickerProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
        <View className="flex-row items-center justify-between p-5">
          <Text className="font-display text-xl text-ink">{title}</Text>
          <Pressable onPress={onClose} className="rounded-input p-1 active:bg-border">
            <Ionicons name="close" size={24} color="#1C2420" />
          </Pressable>
        </View>
        <FlatList
          data={cities}
          keyExtractor={(city) => city.id}
          contentContainerClassName="gap-2 px-5 pb-8"
          ListEmptyComponent={
            <Text className="px-1 font-body text-base text-ink-muted">{t("common.empty")}</Text>
          }
          renderItem={({ item }) => {
            const disabled = item.id === excludeId;
            return (
              <Pressable
                disabled={disabled}
                onPress={() => onSelect(item)}
                className={`flex-row items-center gap-3 rounded-card bg-surface p-4 ${
                  disabled ? "opacity-40" : "active:bg-border"
                }`}
              >
                <Ionicons name="location-outline" size={20} color="#1FA45D" />
                <View>
                  <Text className="font-body-medium text-base text-ink">{item.name}</Text>
                  {item.governorate ? (
                    <Text className="font-body text-xs text-ink-muted">{item.governorate}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
