import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { PendingOperator } from "@/features/admin/core/entities";
import { usePendingOperators, useVerifyOperator } from "@/features/admin/hooks";
import { AdminScreen } from "@/features/admin/ui/AdminScreen";
import { EmptyState, ErrorState, LoadingState, StatusPill } from "@/features/admin/ui/components";

// Pending operators awaiting verification (companies + independent drivers).
// Verifying flips isVerified=true + verifiedAt so their trips become bookable.
export default function AdminOperatorsScreen() {
  const { t } = useTranslation();
  const operators = usePendingOperators();
  const verify = useVerifyOperator();

  return (
    <AdminScreen title={t("admin.operators")} showBack>
      {operators.isLoading ? (
        <LoadingState />
      ) : operators.isError ? (
        <ErrorState label={t("common.error")} />
      ) : !operators.data || operators.data.length === 0 ? (
        <EmptyState label={t("common.empty")} />
      ) : (
        <View className="gap-2">
          {operators.data.map((op) => (
            <OperatorRow
              key={`${op.kind}-${op.id}`}
              operator={op}
              pendingLabel={t("admin.pending")}
              verifyLabel={t("admin.verify")}
              verifying={verify.isPending && verify.variables?.id === op.id}
              onVerify={() => verify.mutate({ id: op.id, kind: op.kind })}
            />
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

function OperatorRow({
  operator,
  pendingLabel,
  verifyLabel,
  verifying,
  onVerify,
}: {
  operator: PendingOperator;
  pendingLabel: string;
  verifyLabel: string;
  verifying: boolean;
  onVerify: () => void;
}) {
  const icon = operator.kind === "company" ? "business-outline" : "person-outline";
  return (
    <View className="gap-3 rounded-card bg-surface p-4 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-input bg-brand-500/10">
          <Ionicons name={icon} size={20} color="#1FA45D" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-body-medium text-base text-ink">{operator.name}</Text>
          {operator.contactPhone ? (
            <Text className="font-body text-sm text-ink-muted">{operator.contactPhone}</Text>
          ) : null}
        </View>
        <StatusPill tone="warning" label={pendingLabel} />
      </View>
      <Pressable
        onPress={onVerify}
        disabled={verifying}
        accessibilityRole="button"
        className={`min-h-11 flex-row items-center justify-center gap-2 rounded-input py-2.5 ${
          verifying ? "bg-success/60" : "bg-success active:opacity-90"
        }`}
      >
        {verifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text className="font-body-medium text-base text-white">{verifyLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
