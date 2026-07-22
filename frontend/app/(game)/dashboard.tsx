import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NATIVE } from "@/src/theme";
import { api } from "@/src/api/client";
import { XPBar } from "@/src/components/XPBar";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { NeonButton } from "@/src/components/NeonButton";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "hack" | "missions" | "ranks" | "profile">("home");

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
        <MutedText style={{ padding: 24, fontSize: 16 }}>Loading Mobile App...</MutedText>
      </View>
    );
  }
  const c = data.character;
  const av = AVATAR_MAP[c.avatar_id] || { icon: "person", color: COLORS.cyan };
  const cl = CLASS_MAP[c.cyber_class] || { name: "Operative", color: COLORS.cyan, icon: "shield" };
  const cm = data.current_mission;

  return (
    <View style={styles.mobileContainer}>
      {/* ---------- COMPACT NATIVE TOP HEADER ---------- */}
      <View style={styles.topHeader}>
        <View style={styles.userInfoPill}>
          <View style={[styles.avatarThumbnail, { borderColor: av.color }]}>
            <Ionicons name={av.icon as any} size={20} color={av.color} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ marginLeft: 8 }}>
            <TitleText style={styles.userName}>{c.name}</TitleText>
            <MutedText style={{ fontSize: 10, color: cl.color }}>{cl.name.toUpperCase()}</MutedText>
          </View>
        </View>

        <View style={styles.headerBadges}>
          <View style={styles.coinPill}>
            <Ionicons name="sparkles" size={12} color={COLORS.amber} style={{ marginRight: 4 }} />
            <MonoText testID="dashboard-coins" style={styles.coinText}>{c.coins} CR</MonoText>
          </View>
          <View style={styles.levelPill}>
            <MonoText style={styles.levelText}>LVL {c.level}</MonoText>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------- MAIN SCROLLABLE CONTENT ---------- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.cyan} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Operative Banner */}
        <View style={styles.heroCard}>
          <Image source={{ uri: HERO_BG }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroCardOverlay} />
          <View style={styles.heroCardBody}>
            <View style={styles.repBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.green} style={{ marginRight: 4 }} />
              <MonoText style={styles.repText}>{c.reputation} REP</MonoText>
            </View>
            <TitleText style={styles.heroTitle}>OPERATIVE HUD</TitleText>
            <MutedText style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              System encrypted · Tactical Network Online
            </MutedText>
          </View>
        </View>

        {/* XP Progress Card */}
        <View style={styles.nativeCard}>
          <XPBar progress={data.xp_progress} level={c.level} label={`${data.xp_to_next_level} XP TO NEXT LEVEL`} />
        </View>

        {/* Active Mission Card */}
        {cm ? (
          <TouchableOpacity
            testID="active-mission-card"
            style={[styles.nativeCard, styles.activeMissionCard]}
            activeOpacity={0.85}
            onPress={() => router.push(`/mission/${cm.id}`)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.missionTag}>
                <MonoText style={styles.missionTagText}>ACTIVE MISSION</MonoText>
              </View>
              <MonoText style={{ color: COLORS.amber, fontSize: 11, fontWeight: "700" }}>★ {cm.difficulty}</MonoText>
            </View>
            <TitleText style={{ fontSize: 18, color: COLORS.textPrimary, marginTop: 8 }}>{cm.title}</TitleText>
            <MutedText numberOfLines={2} style={{ marginTop: 4, fontSize: 12 }}>{cm.story}</MutedText>
            
            <View style={styles.rewardsRow}>
              <View style={styles.rewardChip}>
                <Ionicons name="trophy-outline" size={12} color={COLORS.green} style={{ marginRight: 4 }} />
                <MonoText style={{ color: COLORS.green, fontSize: 11 }}>+{cm.rewards.xp} XP</MonoText>
              </View>
              <View style={styles.rewardChip}>
                <Ionicons name="wallet-outline" size={12} color={COLORS.amber} style={{ marginRight: 4 }} />
                <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>+{cm.rewards.coins} CR</MonoText>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <NeonButton
                testID="start-active-mission"
                label="Engage Mission"
                onPress={() => router.push(`/mission/${cm.id}`)}
                color={COLORS.cyan}
                variant="solid"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.nativeCard}>
            <MutedText>All chapter missions complete. Stand by for tactical briefing.</MutedText>
          </View>
        )}

        {/* Mobile Action Cards Grid */}
        <View style={styles.sectionHeader}>
          <TitleText style={styles.sectionTitle}>Tactical Modules</TitleText>
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity testID="quick-hack" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/hack-bay")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 255, 102, 0.12)" }]}>
              <Ionicons name="terminal" size={22} color={COLORS.green} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Hack Bay</MonoText>
              <MutedText style={styles.actionCardSub}>Infiltrate nodes</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-messenger" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/messenger")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 240, 255, 0.12)" }]}>
              <Ionicons name="chatbubbles" size={22} color={COLORS.cyan} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Inbox</MonoText>
              <MutedText style={styles.actionCardSub}>Encrypted intel</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-story" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/story")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
              <Ionicons name="git-network" size={22} color={COLORS.purple} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Story Mode</MonoText>
              <MutedText style={styles.actionCardSub}>Chapter ops</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-daily" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/daily")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
              <Ionicons name="calendar" size={22} color={COLORS.amber} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Daily Tasks</MonoText>
              <MutedText style={styles.actionCardSub}>Earn rewards</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-skills" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/skills")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 255, 102, 0.12)" }]}>
              <Ionicons name="git-branch" size={22} color={COLORS.green} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Skill Tree</MonoText>
              <MutedText style={styles.actionCardSub}>Upgrades</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-achievements" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/achievements")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
              <Ionicons name="trophy" size={22} color={COLORS.red} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Awards</MonoText>
              <MutedText style={styles.actionCardSub}>Badges</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-leaderboard" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/leaderboard")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
              <Ionicons name="podium" size={22} color={COLORS.purple} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Rankings</MonoText>
              <MutedText style={styles.actionCardSub}>Leaderboard</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity testID="quick-inventory" style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push("/inventory")}>
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 240, 255, 0.12)" }]}>
              <Ionicons name="cube" size={22} color={COLORS.cyan} />
            </View>
            <View style={styles.actionTextContainer}>
              <MonoText style={styles.actionCardTitle}>Gear Bay</MonoText>
              <MutedText style={styles.actionCardSub}>Inventory</MutedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Daily Challenges Horizontal Carousel */}
        <TouchableOpacity testID="daily-card-open" style={styles.nativeCard} activeOpacity={0.8} onPress={() => router.push("/daily")}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <TitleText style={{ fontSize: 15, color: COLORS.textPrimary }}>Daily Challenges</TitleText>
            <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>VIEW ALL →</MonoText>
          </View>
          {data.daily_challenges.map((dc: any) => (
            <View key={dc.id} style={styles.dailyRow}>
              <View style={{ flex: 1 }}>
                <MonoText style={{ color: COLORS.textPrimary, fontSize: 13 }}>{dc.name}</MonoText>
                <MutedText style={{ fontSize: 11 }}>{dc.description}</MutedText>
                <View style={styles.miniBarBg}>
                  <View style={[styles.miniBarFill, { width: `${Math.min(100, (dc.progress / dc.target) * 100)}%` as any, backgroundColor: dc.completed ? COLORS.green : COLORS.amber }]} />
                </View>
              </View>
              <MonoText style={{ color: dc.completed ? COLORS.green : COLORS.amber, fontSize: 11, marginLeft: 10, fontWeight: "700" }}>
                {dc.completed ? "✓ DONE" : `${dc.progress}/${dc.target}`}
              </MonoText>
            </View>
          ))}
        </TouchableOpacity>
      </ScrollView>

      {/* ---------- FIXED NATIVE BOTTOM NAVIGATION BAR ---------- */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => setActiveTab("home")}>
          <Ionicons name={activeTab === "home" ? "home" : "home-outline"} size={22} color={activeTab === "home" ? COLORS.cyan : COLORS.textMuted} />
          <MonoText style={[styles.navText, activeTab === "home" && { color: COLORS.cyan }]}>Home</MonoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => router.push("/hack-bay")}>
          <Ionicons name="terminal-outline" size={22} color={COLORS.textMuted} />
          <MonoText style={styles.navText}>Hack</MonoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => router.push("/story")}>
          <Ionicons name="git-network-outline" size={22} color={COLORS.textMuted} />
          <MonoText style={styles.navText}>Missions</MonoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => router.push("/leaderboard")}>
          <Ionicons name="podium-outline" size={22} color={COLORS.textMuted} />
          <MonoText style={styles.navText}>Ranks</MonoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => router.push("/skills")}>
          <Ionicons name="person-outline" size={22} color={COLORS.textMuted} />
          <MonoText style={styles.navText}>Profile</MonoText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  mobileContainer: { flex: 1, backgroundColor: COLORS.bg },
  
  // Top Header
  topHeader: {
    height: 64, backgroundColor: COLORS.headerBg, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  userInfoPill: { flexDirection: "row", alignItems: "center" },
  avatarThumbnail: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center", borderWidth: 1.5, position: "relative",
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green, position: "absolute", bottom: -1, right: -1, borderWidth: 1, borderColor: COLORS.headerBg },
  userName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  headerBadges: { flexDirection: "row", alignItems: "center" },
  coinPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(245, 158, 11, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.pill, borderBottomWidth: 0, marginRight: 8 },
  coinText: { color: COLORS.amber, fontSize: 11, fontWeight: "700" },
  levelPill: { backgroundColor: "rgba(0, 240, 255, 0.12)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADII.pill, marginRight: 8 },
  levelText: { color: COLORS.cyan, fontSize: 10, fontWeight: "800" },
  notificationBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center" },

  // Main Scroll View
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 90 },

  // Hero Card
  heroCard: {
    height: 110, borderRadius: RADII.lg, overflow: "hidden", marginBottom: 14,
    justifyContent: "flex-end", padding: 14, position: "relative",
    borderWidth: 1, borderColor: COLORS.borderActive, ...SHADOW_NATIVE,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 9, 12, 0.75)" },
  heroCardBody: { zIndex: 2 },
  repBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(0, 255, 102, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADII.pill, marginBottom: 4 },
  repText: { color: COLORS.green, fontSize: 10, fontWeight: "800" },
  heroTitle: { color: COLORS.cyan, fontSize: 20, fontWeight: "900", letterSpacing: 2 },

  // Native Cards
  nativeCard: {
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NATIVE,
  },
  activeMissionCard: { borderColor: COLORS.borderActive },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTag: { backgroundColor: "rgba(0, 240, 255, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.sm },
  missionTagText: { color: COLORS.cyan, fontSize: 10, fontWeight: "800" },
  rewardsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  rewardChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.pill },

  // Action Cards Grid
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 16, color: COLORS.textPrimary },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 14 },
  actionCard: {
    width: "48.5%", backgroundColor: COLORS.surface, borderRadius: RADII.md, padding: 12,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NATIVE,
  },
  actionIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 10 },
  actionTextContainer: { flex: 1 },
  actionCardTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  actionCardSub: { fontSize: 10, color: COLORS.textMuted },

  // Daily Challenge Rows
  dailyRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 6, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%" },

  // Native Bottom Tab Bar
  bottomTabBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: COLORS.bottomBarBg, flexDirection: "row",
    borderTopWidth: 1, borderTopColor: COLORS.border, justifyContent: "space-around", alignItems: "center",
  },
  navTab: { alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  navText: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, fontWeight: "600" },
});
