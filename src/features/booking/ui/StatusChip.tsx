import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import type { BookingStatus } from "../core/entities/booking";

interface StatusChipProps {
  status: BookingStatus;
}

const STATUS_STYLES: Record<BookingStatus, { container: string; text: string }> = {
  confirmed: { container: "bg-brand-100", text: "text-brand-700" },
  boarded: { container: "bg-brand-100", text: "text-brand-700" },
  no_show: { container: "bg-surface-alt", text: "text-ink-muted" },
  cancelled: { container: "bg-surface-alt", text: "text-danger" },
};

const STATUS_KEYS: Record<BookingStatus, string> = {
  confirmed: "booking.statusConfirmed",
  boarded: "booking.statusBoarded",
  no_show: "booking.statusNoShow",
  cancelled: "booking.statusCancelled",
};

export function StatusChip({ status }: StatusChipProps) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status];
  return (
    <View className={`self-start rounded-input px-3 py-1 ${style.container}`}>
      <Text className={`font-body-medium text-xs ${style.text}`}>{t(STATUS_KEYS[status])}</Text>
    </View>
  );
}
