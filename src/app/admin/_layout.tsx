import { Stack } from "expo-router";

// Super-admin section navigator. Headers are rendered per-screen via the design
// system (SafeAreaView + tokens), so the Stack header stays hidden.
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
