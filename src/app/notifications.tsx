import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import {
  notificationTitleKey,
  type Notification,
} from "@/features/notifications/core/entities/notification";

// In-app notifications screen. Lists the caller's notifications newest-first,
// with unread rows tinted (bg-brand-100). Tapping a row marks it read; the
// header "mark all read" clears every unread. Copy comes from i18n keys derived
// from each notification's type (notifications.*). RTL-safe via logical classes.

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: (id: string) => void;
}) {
  const { t } = useTranslation();
  const unread = notification.readAt === null;
  return (
    <Pressable
      onPress={() => onPress(notification.id)}
      className={`flex-row items-start gap-3 rounded-card border border-border p-4 active:opacity-80 ${
        unread ? "bg-brand-100" : "bg-surface"
      }`}
    >
      <View className="mt-0.5">
        <Ionicons
          name={unread ? "notifications" : "notifications-outline"}
          size={22}
          color={unread ? "#1FA45D" : "#5E6B64"}
        />
      </View>
      <View className="flex-1 gap-1">
        <Text className={`font-body-medium text-base text-ink ${unread ? "" : "opacity-80"}`}>
          {t(notificationTitleKey(notification.type))}
        </Text>
      </View>
      {unread ? <View className="mt-2 h-2 w-2 rounded-full bg-brand-500" /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: notifications, isLoading, error } = useNotifications();
  const unreadCount = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center gap-3 p-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="rounded-input p-1 active:bg-border"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="arrow-back" size={24} color="#1C2420" />
        </Pressable>
        <Text className="flex-1 font-display text-2xl text-ink">{t("notifications.title")}</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="rounded-input px-3 py-1.5 active:bg-border"
          >
            <Text className="font-body-medium text-sm text-brand-500">
              {t("notifications.markAllRead")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1FA45D" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-5">
          <Text className="font-body text-base text-danger">{t("common.error")}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(n) => n.id}
          contentContainerClassName="gap-3 px-5 pb-8"
          ListEmptyComponent={
            <View className="items-center gap-2 py-16">
              <Ionicons name="notifications-off-outline" size={40} color="#5E6B64" />
              <Text className="font-body text-base text-ink-muted">{t("notifications.empty")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={(id) => {
                if (item.readAt === null) markRead.mutate(id);
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
