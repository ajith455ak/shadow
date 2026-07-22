import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Expo SDK 54 compatible runtime environment detection.
 * Determines whether the app is executing inside the Expo Go client app
 * versus a custom Development Build or Production Standalone App.
 */
export const isExpoGo: boolean =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";
