import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NATIVE, SHADOW_NEON } from "@/src/theme";
import { api } from "@/src/api/client";
import { XPBar } from "@/src/components/XPBar";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";
import { AVATAR_MAP, CLASS_MAP } from "@/src/utils/maps";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        <MutedText style={{ padding: 24, fontSize: 16 }}>Loading Mobile Operative HUD...</MutedText>
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
          <View style={[styles.avatarThumbnail, { borderColor: av.color }, SHADOW_NEON(av.color)]}>
            <Ionicons name={av.icon as any} size={20} color={av.color} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <TitleText style={styles.userName}>{c.name}</TitleText>
            <MutedText style={{ fontSize: 10, color: cl.color, fontWeight: "700" }}>{cl.name.toUpperCase()}</MutedText>
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
            <TitleText style={styles.heroTitle}>TACTICAL OPERATIVE HUD</TitleText>
            <MutedText style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              Stealth Network Enforced · Node Active
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
                <Ionicons name="sparkles-outline" size={12} color={COLORS.amber} style={{ marginRight: 4 }} />
                <MonoText style={{ color: COLORS.amber, fontSize: 11 }}>+{cm.rewards.coins} CR</MonoText>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Quick Tactical Actions Grid */}
        <View style={styles.sectionHeader}>
          <NeonLabel color={COLORS.cyan}>TACTICAL OPERATIONS</NeonLabel>
        </View>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            testID="quick-nav-hack-bay"
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push("/hack-bay")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 240, 255, 0.12)" }]}>
              <Ionicons name="terminal" size={20} color={COLORS.cyan} />
            </View>
            <View style={styles.actionTextContainer}>
              <TitleText style={styles.actionCardTitle}>Terminal Hack</TitleText>
              <MonoText style={styles.actionCardSub}>BREACH NODES</MonoText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            testID="quick-nav-story"
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push("/story")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(176, 38, 255, 0.12)" }]}>
              <Ionicons name="git-network" size={20} color={COLORS.purple} />
            </View>
            <View style={styles.actionTextContainer}>
              <TitleText style={styles.actionCardTitle}>Story Ops</TitleText>
              <MonoText style={styles.actionCardSub}>5 CHAPTERS</MonoText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            testID="quick-nav-npcs"
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push("/npcs")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(0, 255, 136, 0.12)" }]}>
              <Ionicons name="people" size={20} color={COLORS.green} />
            </View>
            <View style={styles.actionTextContainer}>
              <TitleText style={styles.actionCardTitle}>NPC Intel</TitleText>
              <MonoText style={styles.actionCardSub}>CONTACTS</MonoText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            testID="quick-nav-inventory"
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push("/inventory")}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255, 176, 0, 0.12)" }]}>
              <Ionicons name="cube" size={20} color={COLORS.amber} />
            </View>
            <View style={styles.actionTextContainer}>
              <TitleText style={styles.actionCardTitle}>Gear & Gear</TitleText>
              <MonoText style={styles.actionCardSub}>EQUIPMENT</MonoText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Challenges */}
        <TouchableOpacity
          testID="quick-nav-daily-challenges"
          style={styles.nativeCard}
          activeOpacity={0.85}
          onPress={() => router.push("/daily-challenges")}
        >
          <View style={styles.cardHeaderRow}>
            <NeonLabel color={COLORS.amber}>DAILY CHALLENGES</NeonLabel>
            <MonoText style={{ color: COLORS.cyan, fontSize: 11, fontWeight: "700" }}>VIEW ALL →</MonoText>
          </View>
          {data.daily_challenges?.slice(0, 2).map((dc: any) => (
            <View key={dc.id} style={styles.dailyRow}>
              <View style={{ flex: 1 }}>
                <MonoText style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: "700" }}>{dc.name}</MonoText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  mobileContainer: { flex: 1, backgroundColor: COLORS.bg },
  
  // Top Header
  topHeader: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 14,
    backgroundColor: COLORS.headerBg, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  userInfoPill: { flexDirection: "row", alignItems: "center" },
  avatarThumbnail: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center", borderWidth: 1.5, position: "relative",
  },
  onlineDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.green, position: "absolute", bottom: -1, right: -1, borderWidth: 1.5, borderColor: COLORS.headerBg },
  userName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  headerBadges: { flexDirection: "row", alignItems: "center" },
  coinPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 176, 0, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.pill, borderBottomWidth: 0, marginRight: 8, borderWidth: 1, borderColor: "rgba(255, 176, 0, 0.3)" },
  coinText: { color: COLORS.amber, fontSize: 11, fontWeight: "800" },
  levelPill: { backgroundColor: "rgba(0, 240, 255, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.pill, borderWidth: 1, borderColor: "rgba(0, 240, 255, 0.3)" },
  levelText: { color: COLORS.cyan, fontSize: 11, fontWeight: "800" },

  // Main Scroll View
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },

  // Hero Card
  heroCard: {
    height: 120, borderRadius: RADII.xl, overflow: "hidden", marginBottom: 14,
    justifyContent: "flex-end", padding: 16, position: "relative",
    borderWidth: 1, borderColor: COLORS.borderActive, ...SHADOW_NEON(COLORS.cyanGlow),
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5, 6, 10, 0.75)" },
  heroCardBody: { zIndex: 2 },
  repBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(0, 255, 136, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADII.pill, marginBottom: 4 },
  repText: { color: COLORS.green, fontSize: 10, fontWeight: "800" },
  heroTitle: { color: COLORS.cyan, fontSize: 20, fontWeight: "900", letterSpacing: 2 },

  // Native Cards
  nativeCard: {
    backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.xl, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NATIVE,
  },
  activeMissionCard: { borderColor: COLORS.borderActive, ...SHADOW_NEON(COLORS.cyanGlow) },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTag: { backgroundColor: "rgba(0, 240, 255, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.sm },
  missionTagText: { color: COLORS.cyan, fontSize: 10, fontWeight: "800" },
  rewardsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  rewardChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.pill },

  // Action Cards Grid
  sectionHeader: { marginBottom: 10 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 14 },
  actionCard: {
    width: "48.5%", backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.lg, padding: 14,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NATIVE,
  },
  actionIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 10 },
  actionTextContainer: { flex: 1 },
  actionCardTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  actionCardSub: { fontSize: 10, color: COLORS.textMuted },

  // Daily Challenge Rows
  dailyRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 6, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%" },
});
