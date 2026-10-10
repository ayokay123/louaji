import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import type { AdminUser } from "@/features/admin/core/entities";
import { useAdminUsers } from "@/features/admin/hooks";
import { AdminScreen } from "@/features/admin/ui/AdminScreen";
import { EmptyState, ErrorState, LoadingState } from "@/features/admin/ui/components";

// Platform users with their granted roles. Role granting is wired through
// useGrantRole / POST /api/admin/roles; this screen lists users and surfaces
// each user's current role grants as chips.
export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const users = useAdminUsers();

  return (
    <AdminScreen title={t("admin.users")} showBack>
      {users.isLoading ? (
        <LoadingState />
      ) : users.isError ? (
        <ErrorState label={t("common.error")} />
      ) : !users.data || users.data.length === 0 ? (
        <EmptyState label={t("common.empty")} />
      ) : (
        <View className="gap-2">
          {users.data.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <View className="gap-2 rounded-card bg-surface p-4 shadow-sm">
      <View className="gap-0.5">
        <Text className="font-body-medium text-base text-ink">{user.fullName ?? user.phone}</Text>
        <Text className="font-body text-sm text-ink-muted">{user.phone}</Text>
      </View>
      {user.roles.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {user.roles.map((role) => (
            <View key={role} className="rounded-input bg-brand-500/10 px-2.5 py-1">
              <Text className="font-body-medium text-xs text-brand-700">{role}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
