import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { XPBar } from "@/src/components/XPBar";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"CHATS" | "STATUS" | "CALLS">("CHATS");

  const load = useCallback(async () => {
    try {
      const d = await api.get<any>("/dashboard");
      setData(d);
    } catch { /* noop */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!data) {
    return (
      <View style={styles.loadingRoot}>
        <MutedText style={{ padding: 24, fontSize: 16 }}>Initializing WhatsApp Android App...</MutedText>
      </View>
    );
  }
  const c = data.character;
  const av = AVATAR_MAP[c.avatar_id] || { icon: "person", color: COLORS.green };
  const cl = CLASS_MAP[c.cyber_class] || { name: "Operative", color: COLORS.green, icon: "shield" };
  const cm = data.current_mission;

  return (
    <View style={styles.mobileRoot}>
      {/* ---------- WHATSAPP ANDROID ACTION BAR ---------- */}
      <View style={styles.actionBar}>
        <TitleText style={styles.actionTitle}>Shadow AI</TitleText>
        <View style={styles.actionIcons}>
          <Ionicons name="camera-outline" size={22} color={COLORS.textSecondary} style={styles.iconBtn} />
          <Ionicons name="search" size={22} color={COLORS.textSecondary} style={styles.iconBtn} />
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textSecondary} style={styles.iconBtn} />
        </View>
      </View>

      {/* ---------- WHATSAPP ANDROID TAB BAR ---------- */}
      <View style={styles.tabBar}>
        <Pressable style={[styles.tabItem, activeTab === "CHATS" && styles.activeTabItem]} onPress={() => setActiveTab("CHATS")}>
          <MonoText style={[styles.tabText, activeTab === "CHATS" && styles.activeTabText]}>CHATS</MonoText>
          <View style={styles.unreadBadge}>
            <MonoText style={styles.unreadText}>3</MonoText>
          </View>
        </Pressable>
        <Pressable style={[styles.tabItem, activeTab === "STATUS" && styles.activeTabItem]} onPress={() => setActiveTab("STATUS")}>
          <MonoText style={[styles.tabText, activeTab === "STATUS" && styles.activeTabText]}>STATUS</MonoText>
          <View style={styles.statusDot} />
        </Pressable>
        <Pressable style={[styles.tabItem, activeTab === "CALLS" && styles.activeTabItem]} onPress={() => setActiveTab("CALLS")}>
          <MonoText style={[styles.tabText, activeTab === "CALLS" && styles.activeTabText]}>CALLS</MonoText>
        </Pressable>
      </View>

      {/* ---------- MAIN TAB CONTENT SCROLLVIEW ---------- */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {activeTab === "CHATS" && (
          <View style={styles.chatListContainer}>
            {/* Active Mission Tactical Chat Row */}
            {cm && (
              <Pressable testID="active-mission-card" style={styles.chatCardRow} onPress={() => router.push(`/mission/${cm.id}`)}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="terminal" size={24} color={COLORS.green} />
                  <View style={styles.onlineBadge} />
                </View>
                <View style={styles.chatCardBody}>
                  <View style={styles.chatCardHeader}>
                    <TitleText style={styles.chatCardTitle}>{cm.title}</TitleText>
                    <MonoText style={styles.chatCardTime}>10:45 AM</MonoText>
                  </View>
                  <View style={styles.chatCardFooter}>
                    <MutedText numberOfLines={1} style={styles.chatCardPreview}>
                      ★ {cm.difficulty} · rewards: +{cm.rewards.xp} XP
                    </MutedText>
                    <View style={styles.greenBadge}>
                      <MonoText style={styles.greenBadgeText}>1</MonoText>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Operative HQ Chat Row */}
            <Pressable style={styles.chatCardRow} onPress={() => router.push("/hack-bay")}>
              <View style={[styles.avatarCircle, { backgroundColor: "#1c2a33" }]}>
                <Ionicons name="hardware-chip" size={24} color={COLORS.cyan} />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.chatCardBody}>
                <View style={styles.chatCardHeader}>
                  <TitleText style={styles.chatCardTitle}>Operative {c.name}</TitleText>
                  <MonoText style={styles.chatCardTime}>09:30 AM</MonoText>
                </View>
                <View style={styles.chatCardFooter}>
                  <MutedText numberOfLines={1} style={styles.chatCardPreview}>
                    [{cl.name.toUpperCase()}] · Rep: {c.reputation} · Coins: {c.coins} CR
                  </MutedText>
                  <View style={styles.greenBadge}>
                    <MonoText style={styles.greenBadgeText}>2</MonoText>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Inbox / Messages Chat Row */}
            <Pressable testID="quick-messenger" style={styles.chatCardRow} onPress={() => router.push("/messenger")}>
              <View style={[styles.avatarCircle, { backgroundColor: "#2b2111" }]}>
                <Ionicons name="mail" size={24} color={COLORS.amber} />
              </View>
              <View style={styles.chatCardBody}>
                <View style={styles.chatCardHeader}>
                  <TitleText style={styles.chatCardTitle}>Tactical Messenger Inbox</TitleText>
                  <MonoText style={styles.chatCardTime}>Yesterday</MonoText>
                </View>
                <View style={styles.chatCardFooter}>
                  <MutedText numberOfLines={1} style={styles.chatCardPreview}>
                    Tap to access secure agent transmissions.
                  </MutedText>
                </View>
              </View>
            </Pressable>

            {/* Stats Summary Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <NeonLabel color={COLORS.amber}>CREDITS</NeonLabel>
                  <MonoText testID="dashboard-coins" style={styles.bigStat}>{c.coins}</MonoText>
                </View>
                <View style={styles.statBox}>
                  <NeonLabel color={COLORS.purple}>LEVEL</NeonLabel>
                  <MonoText style={styles.bigStat}>{c.level}</MonoText>
                </View>
                <View style={styles.statBox}>
                  <NeonLabel color={COLORS.green}>REP</NeonLabel>
                  <MonoText style={styles.bigStat}>{c.reputation}</MonoText>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <XPBar progress={data.xp_progress} level={c.level} label={`${data.xp_to_next_level} XP TO NEXT`} />
              </View>
            </View>

            {/* Quick Action Grid */}
            <View style={styles.quickGrid}>
              <Pressable testID="quick-hack" style={styles.quickBtn} onPress={() => router.push("/hack-bay")}>
                <Ionicons name="terminal" size={20} color={COLORS.green} />
                <MonoText style={styles.quickLabel}>Hack</MonoText>
              </Pressable>
              <Pressable testID="quick-story" style={styles.quickBtn} onPress={() => router.push("/story")}>
                <Ionicons name="git-network" size={20} color={COLORS.cyan} />
                <MonoText style={styles.quickLabel}>Story</MonoText>
              </Pressable>
              <Pressable testID="quick-daily" style={styles.quickBtn} onPress={() => router.push("/daily")}>
                <Ionicons name="calendar" size={20} color={COLORS.amber} />
                <MonoText style={styles.quickLabel}>Daily</MonoText>
              </Pressable>
              <Pressable testID="quick-skills" style={styles.quickBtn} onPress={() => router.push("/skills")}>
                <Ionicons name="git-branch" size={20} color={COLORS.green} />
                <MonoText style={styles.quickLabel}>Skills</MonoText>
              </Pressable>
              <Pressable testID="quick-achievements" style={styles.quickBtn} onPress={() => router.push("/achievements")}>
                <Ionicons name="trophy" size={20} color={COLORS.purple} />
                <MonoText style={styles.quickLabel}>Awards</MonoText>
              </Pressable>
              <Pressable testID="quick-inventory" style={styles.quickBtn} onPress={() => router.push("/inventory")}>
                <Ionicons name="cube" size={20} color={COLORS.cyan} />
                <MonoText style={styles.quickLabel}>Gear</MonoText>
              </Pressable>
            </View>
          </View>
        )}

        {activeTab === "STATUS" && (
          <View style={styles.tabSection}>
            <Pressable testID="daily-card-open" onPress={() => router.push("/daily")} style={styles.dailyCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <NeonLabel color={COLORS.amber}>DAILY TACTICAL MISSIONS</NeonLabel>
                <MonoText style={{ color: COLORS.green, fontSize: 11 }}>VIEW ALL →</MonoText>
              </View>
              {data.daily_challenges.map((dc: any) => (
                <View key={dc.id} style={styles.dailyRow}>
                  <View style={{ flex: 1 }}>
                    <MonoText style={{ color: COLORS.textPrimary, fontSize: 14 }}>{dc.name}</MonoText>
                    <MutedText style={{ fontSize: 12 }}>{dc.description}</MutedText>
                  </View>
                  <MonoText style={{ color: dc.completed ? COLORS.green : COLORS.amber, fontSize: 12, marginLeft: 8 }}>
                    {dc.completed ? "✓ DONE" : `${dc.progress}/${dc.target}`}
                  </MonoText>
                </View>
              ))}
            </Pressable>

            {cm && (
              <View style={styles.activeMissionBox}>
                <NeonLabel color={COLORS.green}>ACTIVE OPERATION</NeonLabel>
                <TitleText style={{ fontSize: 20, color: COLORS.textPrimary, marginTop: 4 }}>{cm.title}</TitleText>
                <MutedText style={{ marginTop: 4 }}>{cm.story}</MutedText>
                <View style={{ marginTop: 12 }}>
                  <NeonButton
                    testID="start-active-mission"
                    label="Engage Operation"
                    onPress={() => router.push(`/mission/${cm.id}`)}
                    color={COLORS.green}
                    variant="solid"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === "CALLS" && (
          <View style={styles.tabSection}>
            <Pressable testID="quick-leaderboard" style={styles.chatCardRow} onPress={() => router.push("/leaderboard")}>
              <View style={[styles.avatarCircle, { backgroundColor: "#3a141a" }]}>
                <Ionicons name="podium" size={24} color={COLORS.red} />
              </View>
              <View style={styles.chatCardBody}>
                <View style={styles.chatCardHeader}>
                  <TitleText style={styles.chatCardTitle}>Operative Leaderboard</TitleText>
                  <MonoText style={styles.chatCardTime}>Live</MonoText>
                </View>
                <MutedText style={styles.chatCardPreview}>
                  Global agent rankings & reputation scores.
                </MutedText>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ---------- WHATSAPP FLOATING ACTION BUTTON (FAB) ---------- */}
      <Pressable testID="quick-hack" style={styles.fab} onPress={() => router.push("/hack-bay")}>
        <Ionicons name="chatbox-ellipses" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  mobileRoot: { flex: 1, backgroundColor: COLORS.bg },
  
  // Action Bar
  actionBar: { height: 56, backgroundColor: COLORS.headerBg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  actionTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "700" },
  actionIcons: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 18 },

  // Tab Bar
  tabBar: { height: 44, backgroundColor: COLORS.headerBg, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabItem: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTabItem: { borderBottomColor: COLORS.green },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700" },
  activeTabText: { color: COLORS.green },
  unreadBadge: { backgroundColor: COLORS.green, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 },
  unreadText: { color: "#000000", fontSize: 10, fontWeight: "900" },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green, marginLeft: 6 },

  // Scroll content
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  chatListContainer: {},
  chatCardRow: { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center" },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#102820", justifyContent: "center", alignItems: "center", marginRight: 14, position: "relative" },
  onlineBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green, position: "absolute", bottom: 0, right: 0, borderWidth: 2, borderColor: COLORS.surface },
  chatCardBody: { flex: 1 },
  chatCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  chatCardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "600" },
  chatCardTime: { color: COLORS.textMuted, fontSize: 11 },
  chatCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatCardPreview: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  greenBadge: { backgroundColor: COLORS.green, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  greenBadgeText: { color: "#000000", fontSize: 11, fontWeight: "900" },

  // Stats Card
  statsCard: { margin: 14, padding: 14, backgroundColor: COLORS.surfaceElevated, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  bigStat: { color: COLORS.textPrimary, fontSize: 18, marginTop: 4, fontWeight: "700" },

  // Quick Grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginHorizontal: 14, marginBottom: 14 },
  quickBtn: { width: "31%", backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  quickLabel: { color: COLORS.textPrimary, fontSize: 11, marginTop: 4 },

  // Tab Section
  tabSection: { padding: 14 },
  dailyCard: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  dailyRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activeMissionBox: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.green },

  // WhatsApp FAB
  fab: { position: "absolute", bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.fabBg, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
});
