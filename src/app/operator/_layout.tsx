import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

// Operator admin stack. Header shown (unlike the passenger tabs) so each
// operator screen carries its own title and back affordance.
export default function OperatorLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#F4F7F5" },
        headerTintColor: "#13231B",
        headerTitleStyle: { fontFamily: "Cairo_700Bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("operator.dashboard") }} />
      <Stack.Screen name="onboard" options={{ title: t("operator.onboarding") }} />
      <Stack.Screen name="fleet" options={{ title: t("operator.fleet") }} />
      <Stack.Screen name="schedule" options={{ title: t("operator.scheduleTrip") }} />
      <Stack.Screen name="trip/[id]" options={{ title: t("operator.seatBoard") }} />
    </Stack>
  );
}
