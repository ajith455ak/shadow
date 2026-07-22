import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@/src/api/client";
import { isExpoGo } from "@/src/utils/platform";

/**
 * Expo SDK 53/54 Dynamic Notification Module Loader.
 * Prevents top-level evaluation of `expo-notifications` in Expo Go,
 * which causes automatic initialization of DevicePushTokenAutoRegistration.
 */
async function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    return Notifications;
  } catch (err) {
    console.log("Failed to dynamically import expo-notifications:", err);
    return null;
  }
}

/**
 * Register device for Expo Push Notifications.
 * Returns null cleanly inside Expo Go without throwing runtime exceptions.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.warn("Running in Expo Go. Remote push notifications are disabled.");
    return null;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

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
