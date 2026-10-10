import { Stack } from "expo-router";

// Auth flow group: welcome → phone → verify. Headerless; each screen owns its
// own back affordance. Reached when an unauthenticated user taps log in / sign
// up, or on first launch via the welcome splash. See docs/SRS.md §2.1.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
