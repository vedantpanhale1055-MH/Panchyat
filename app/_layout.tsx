import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="register" />
        <Stack.Screen name="approval" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </UserProvider>
  );
}