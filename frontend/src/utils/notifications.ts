import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "@/src/api/client";
import { isExpoGo } from "@/src/utils/platform";

/**
 * Expo SDK 54 Notification Handler.
 * Sets display behavior for incoming foreground push notifications.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for Expo Push Notifications.
 * Gracefully handles Expo Go vs Development/Production builds.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo SDK 54: Expo Go client app does not support remote push notifications.
  // We return null gracefully without throwing runtime exceptions or showing red screens.
  if (isExpoGo) {
    console.warn("Running in Expo Go. Remote push notifications are disabled.");
    return null;
  }

  let token: string | null = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Tactical Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00F0FF",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied.");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = pushTokenData.data;

    if (token) {
      await api.post("/push/register", {
        expo_push_token: token,
        device_name: `${Platform.OS.toUpperCase()} Device`,
        platform: Platform.OS,
      });
    }
  } catch (error) {
    console.log("Failed to register Expo push token:", error);
  }

  return token;
}

export async function unregisterPushNotificationsAsync(token: string): Promise<void> {
  if (isExpoGo) return;
  try {
    await api.post("/push/unregister", { expo_push_token: token });
  } catch {
    /* noop */
  }
}
