import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NEON } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { registerForPushNotificationsAsync } from "@/src/utils/notifications";
import { isExpoGo } from "@/src/utils/platform";

export default function NotificationSettings() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(!isExpoGo);
  const [missionAlerts, setMissionAlerts] = useState(true);
  const [levelUpAlerts, setLevelUpAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const togglePush = async (val: boolean) => {
    setEnabled(val);
    if (val && !isExpoGo) {
      setLoading(true);
      await registerForPushNotificationsAsync();
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (isExpoGo) return;
    setTestStatus("DISPATCHING...");
    try {
      const res = await api.post<any>("/push/test");
      setTestStatus(`SENT: ${res.dispatch_result?.sent ?? 1} SUCCESS`);
    } catch (err: any) {
      setTestStatus(`FAILED: ${err.message || "No registered token"}`);
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.cyan} />
        </Pressable>
        <TitleText style={styles.headerTitle}>PUSH NOTIFICATIONS</TitleText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Expo Go Info Banner */}
        {isExpoGo ? (
          <View style={styles.expoGoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.cyan} style={{ marginRight: 10 }} />
            <MutedText style={styles.expoGoText}>
              Remote Push Notifications require an Expo Development Build. All other application functionality is available.
            </MutedText>
          </View>
        ) : null}

        {/* Main Enable Card */}
        <View style={[styles.card, !isExpoGo && SHADOW_NEON(COLORS.cyanGlow)]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications" size={24} color={COLORS.cyan} style={{ marginRight: 12 }} />
              <View>
                <TitleText style={{ fontSize: 16 }}>Tactical Push Link</TitleText>
                <MutedText style={{ fontSize: 11 }}>
                  {isExpoGo ? "Disabled in Expo Go Client" : "Receive system breaches & level up alerts"}
                </MutedText>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={togglePush}
              disabled={isExpoGo}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.cyan }}
              thumbColor={COLORS.textPrimary}
            />
          </View>
        </View>

        {/* Categories */}
        <NeonLabel color={COLORS.cyan} style={{ marginTop: 20, marginBottom: 10 }}>{"// ALERT CHANNELS"}</NeonLabel>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <MonoText style={{ color: COLORS.textPrimary, fontSize: 13 }}>Mission Completion & Rewards</MonoText>
            <Switch
              value={missionAlerts}
              onValueChange={setMissionAlerts}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.green }}
              thumbColor={COLORS.textPrimary}
            />
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 12 }]}>
            <MonoText style={{ color: COLORS.textPrimary, fontSize: 13 }}>Level Up & Reputation Badges</MonoText>
            <Switch
              value={levelUpAlerts}
              onValueChange={setLevelUpAlerts}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.purple }}
              thumbColor={COLORS.textPrimary}
            />
          </View>
        </View>

        {/* Test Dispatch Button (Hidden in Expo Go) */}
        {!isExpoGo ? (
          <>
            <Pressable style={styles.testBtn} onPress={sendTestNotification}>
              <Ionicons name="paper-plane-outline" size={18} color={COLORS.cyan} style={{ marginRight: 8 }} />
              <MonoText style={styles.testBtnText}>DISPATCH TEST PUSH NOTIFICATION</MonoText>
            </Pressable>

            {testStatus ? (
              <MonoText style={styles.statusText}>{testStatus}</MonoText>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  scrollContent: { padding: 16 },
  expoGoBanner: {
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderRadius: RADII.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.25)",
  },
  expoGoText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  card: { backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.xl, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  testBtn: {
    marginTop: 24,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.cyan,
    borderWidth: 1.5,
    borderRadius: RADII.lg,
    paddingVertical: 14,
    flexDirection: "row",
    justify.content: "center",
    alignItems: "center",
  },
  testBtnText: { color: COLORS.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  statusText: { color: COLORS.green, fontSize: 11, textAlign: "center", marginTop: 12, fontWeight: "700" },
});
