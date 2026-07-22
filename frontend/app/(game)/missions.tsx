import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADII, SHADOW_NEON } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

export default function MissionsScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "available" | "active" | "completed">("all");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/missions");
      const list = res.missions || res || [];
      setMissions(list);
    } catch (err) {
      console.log("Failed to fetch missions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMissions();
    }, [fetchMissions])
  );

  const handleAccept = async (id: string) => {
    try {
      const res = await api.post<any>(`/missions/${id}/accept`);
      setActionMessage(res.message || "Mission accepted!");
      fetchMissions();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || "Could not accept mission"}`);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await api.post<any>(`/missions/${id}/complete`);
      setActionMessage(`COMPLETED! +${res.reward_xp} XP | +${res.reward_coins} CR`);
      fetchMissions();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || "Could not complete mission"}`);
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (activeTab === "all") return true;
    return m.status === activeTab;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <NeonLabel color={COLORS.cyan}>{"// SHADOW OPERATIONS GRID"}</NeonLabel>
        <TitleText style={styles.headerTitle}>ACTIVE MISSIONS</TitleText>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["all", "available", "active", "completed"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <MonoText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </MonoText>
          </Pressable>
        ))}
      </View>

      {actionMessage ? (
        <View style={styles.actionBanner}>
          <MonoText style={styles.actionText}>{actionMessage}</MonoText>
        </View>
      ) : null}

      {/* Mission List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMissions(); }} tintColor={COLORS.cyan} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.cyan} />
            <MonoText style={{ marginTop: 12, color: COLORS.textMuted }}>Scanning tactical nodes...</MonoText>
          </View>
        ) : filteredMissions.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.textMuted} />
            <TitleText style={{ marginTop: 12, fontSize: 16 }}>NO MISSIONS FOUND</TitleText>
            <MutedText style={{ textAlign: "center", marginTop: 4 }}>
              No operations matching status filter '{activeTab}'.
            </MutedText>
            <Pressable style={styles.retryBtn} onPress={fetchMissions}>
              <MonoText style={styles.retryBtnText}>RELOAD MISSIONS</MonoText>
            </Pressable>
          </View>
        ) : (
          filteredMissions.map((m) => (
            <View key={m.id} style={[styles.card, SHADOW_NEON(m.status === "active" ? COLORS.cyanGlow : COLORS.purpleGlow)]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <MonoText style={styles.cardDiff}>{`[LVL ${m.required_level || 1} • ${m.difficulty || "Easy"}]`}</MonoText>
                  <TitleText style={styles.cardTitle}>{m.title}</TitleText>
                </View>
                <View style={[styles.badge, m.status === "completed" ? styles.badgeDone : m.status === "active" ? styles.badgeActive : styles.badgeAvail]}>
                  <MonoText style={styles.badgeText}>{(m.status || "AVAILABLE").toUpperCase()}</MonoText>
                </View>
              </View>

              <MutedText style={styles.cardDesc}>{m.description}</MutedText>

              <View style={styles.cardFooter}>
                <View style={styles.rewardRow}>
                  <Ionicons name="flash" size={14} color={COLORS.cyan} />
                  <MonoText style={styles.rewardText}>{`+${m.reward_xp} XP`}</MonoText>
                  <Ionicons name="cash-outline" size={14} color={COLORS.amber} style={{ marginLeft: 12 }} />
                  <MonoText style={[styles.rewardText, { color: COLORS.amber }]}>{`+${m.reward_coins} CR`}</MonoText>
                </View>

                {m.status === "available" || !m.status ? (
                  <Pressable style={styles.acceptBtn} onPress={() => handleAccept(m.id)}>
                    <MonoText style={styles.btnText}>ACCEPT</MonoText>
                  </Pressable>
                ) : m.status === "active" ? (
                  <Pressable style={styles.completeBtn} onPress={() => handleComplete(m.id)}>
                    <MonoText style={styles.btnText}>COMPLETE</MonoText>
                  </Pressable>
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.surface, padding: 4, marginHorizontal: 16, marginTop: 12, borderRadius: RADII.lg },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: RADII.md },
  tabBtnActive: { backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.cyan },
  tabText: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700" },
  tabTextActive: { color: COLORS.cyan },
  actionBanner: { backgroundColor: "rgba(0, 240, 255, 0.1)", borderVerticalWidth: 1, borderColor: COLORS.cyan, padding: 8, marginHorizontal: 16, marginTop: 8 },
  actionText: { color: COLORS.cyan, fontSize: 11, textAlign: "center", fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  centerBox: { paddingVertical: 60, alignItems: "center" },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.cyan, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 20, borderRadius: RADII.md },
  retryBtnText: { color: COLORS.cyan, fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.xl, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardDiff: { color: COLORS.cyan, fontSize: 10, fontWeight: "700" },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, marginTop: 2 },
  cardDesc: { marginTop: 8, fontSize: 12, lineHeight: 18 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  rewardRow: { flexDirection: "row", alignItems: "center" },
  rewardText: { color: COLORS.cyan, fontSize: 12, fontWeight: "700", marginLeft: 4 },
  acceptBtn: { backgroundColor: COLORS.cyan, paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADII.md },
  completeBtn: { backgroundColor: COLORS.green, paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADII.md },
  btnText: { color: "#000", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADII.sm },
  badgeAvail: { backgroundColor: "rgba(0, 240, 255, 0.15)" },
  badgeActive: { backgroundColor: "rgba(168, 85, 247, 0.2)" },
  badgeDone: { backgroundColor: "rgba(34, 197, 94, 0.2)" },
  badgeText: { color: COLORS.textPrimary, fontSize: 9, fontWeight: "800" },
});
