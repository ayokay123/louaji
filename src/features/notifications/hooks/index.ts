import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/shared/lib/http/client";
import type { Notification } from "../core/entities/notification";

// React Query hooks calling the notification API routes. Query keys are arrays
// so mutations can invalidate precisely. Mirrors src/features/booking/hooks.
// See docs/BEST_PRACTICES.md (data fetching).

export const notificationKeys = {
  list: () => ["notifications", "list"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () =>
      (await apiGet<{ notifications: Notification[] }>("/api/notifications")).notifications,
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => n.readAt === null).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiSend(`/api/notifications/${notificationId}/read`, "POST"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiSend("/api/notifications/read-all", "POST"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
