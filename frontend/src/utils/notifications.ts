import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "@/src/api/client";

// Set notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

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

  try {
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
    console.log("Failed to get Expo push token:", error);
  }

  return token;
}

export async function unregisterPushNotificationsAsync(token: string): Promise<void> {
  try {
    await api.post("/push/unregister", { expo_push_token: token });
  } catch {
    /* noop */
  }
}
