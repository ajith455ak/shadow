import { useEffect, useState } from "react";
import {
  FlatList, Platform, ScrollView, StyleSheet, TouchableOpacity, View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NATIVE } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { NeonButton } from "@/src/components/NeonButton";
import { CyberInput } from "@/src/components/CyberInput";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

type Avatar = { id: string; icon: any; color: string };
type CyberClass = {
  id: string; name: string; icon: any; color: string; description: string;
  starting_stats: Record<string, number>; bonus: string;
};

export default function CharacterCreation() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [classes, setClasses] = useState<CyberClass[]>([]);
  const [name, setName] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [classIdx, setClassIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const opts = await api.get<{ avatars: Avatar[]; classes: CyberClass[] }>("/character/options");
        setAvatars(opts.avatars);
        setClasses(opts.classes);
      } catch (e: any) {
        setErr(e?.message || "Failed to load options");
      }
    })();
  }, []);

  const create = async () => {
    setErr(null);
    if (!name || name.length < 2) { setErr("Enter an operative callsign (2+ characters)"); return; }
    setLoading(true);
    try {
      await api.post("/character", {
        name: name.trim(),
        avatar_id: avatars[avatarIdx].id,
        cyber_class: classes[classIdx].id,
      });
      await refresh();
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Failed to create character");
    } finally {
      setLoading(false);
    }
  };

  if (!avatars.length || !classes.length) {
    return (
      <View style={styles.loadingRoot}>
        <MutedText style={{ padding: 24, fontSize: 16 }}>Loading Mobile Operative Creator...</MutedText>
      </View>
    );
  }

  const selectedClass = classes[classIdx];

  return (
    <View style={styles.mobileRoot}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.headerBlock}>
          <NeonLabel color={COLORS.cyan}>{"// OPERATIVE_INITIALIZATION.BAT"}</NeonLabel>
          <TitleText style={styles.headerTitle}>CREATE NEW OPERATIVE</TitleText>
          <MutedText style={styles.headerSubtitle}>
            Configure your stealth identity, avatar badge, and cyber combat specialization.
          </MutedText>
        </View>

        {/* Operative Callsign Input */}
        <View style={styles.sectionCard}>
          <CyberInput
            testID="character-name-input"
            label="OPERATIVE CALLSIGN"
            value={name}
            onChangeText={setName}
            placeholder="e.g. VEX_ZERO, PHANTOM"
            autoCapitalize="characters"
          />
        </View>

        {/* Avatar Carousel Selector */}
        <View style={styles.sectionCard}>
          <NeonLabel color={COLORS.purple}>SELECT AVATAR BADGE</NeonLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarCarousel}>
            {avatars.map((av, idx) => {
              const active = idx === avatarIdx;
              return (
                <TouchableOpacity
                  key={av.id}
                  testID={`avatar-option-${idx}`}
                  onPress={() => setAvatarIdx(idx)}
                  activeOpacity={0.7}
                  style={[
                    styles.avatarBadgeTile,
                    { borderColor: active ? av.color : COLORS.border },
                    active && { backgroundColor: "rgba(0, 240, 255, 0.1)", ...SHADOW_NATIVE(av.color) },
                  ]}
                >
                  <Ionicons name={av.icon as any} size={32} color={av.color} />
                  {active && <View style={[styles.activeDot, { backgroundColor: av.color }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Cyber Class Cards */}
        <View style={styles.sectionCard}>
          <NeonLabel color={COLORS.green}>CHOOSE SPECIALIZATION CLASS</NeonLabel>
          <View style={styles.classGrid}>
            {classes.map((cl, idx) => {
              const active = idx === classIdx;
              return (
                <TouchableOpacity
                  key={cl.id}
                  testID={`class-option-${idx}`}
                  onPress={() => setClassIdx(idx)}
                  activeOpacity={0.7}
                  style={[
                    styles.classTile,
                    { borderColor: active ? cl.color : COLORS.border },
                    active && { backgroundColor: "rgba(0, 255, 102, 0.08)", ...SHADOW_NATIVE(cl.color) },
                  ]}
                >
                  <View style={styles.classTileHeader}>
                    <Ionicons name={cl.icon as any} size={22} color={cl.color} style={{ marginRight: 8 }} />
                    <TitleText style={{ fontSize: 16, color: active ? cl.color : COLORS.textPrimary }}>
                      {cl.name}
                    </TitleText>
                  </View>
                  <MutedText style={styles.classTileDesc}>{cl.description}</MutedText>
                  <View style={styles.bonusTag}>
                    <MonoText style={{ color: COLORS.amber, fontSize: 11, fontWeight: "700" }}>
                      ★ {cl.bonus}
                    </MonoText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Class Stats Summary */}
        <View style={[styles.sectionCard, { borderColor: selectedClass.color }]}>
          <NeonLabel color={selectedClass.color}>{selectedClass.name.toUpperCase()} BASE STATS</NeonLabel>
          <View style={styles.statsRow}>
            {Object.entries(selectedClass.starting_stats).map(([k, v]) => (
              <View key={k} style={styles.statBox}>
                <MonoText style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>{k}</MonoText>
                <TitleText style={{ color: selectedClass.color, fontSize: 18, marginTop: 2 }}>{v}</TitleText>
              </View>
            ))}
          </View>
        </View>

        {err ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.red} style={{ marginRight: 6 }} />
            <MonoText style={{ color: COLORS.red, fontSize: 12 }}>{err}</MonoText>
          </View>
        ) : null}

        {/* Floating Bottom CTA */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <NeonButton
            testID="create-character-submit"
            label={loading ? "INITIALIZING..." : "INITIALIZE OPERATIVE"}
            onPress={create}
            color={COLORS.cyan}
            variant="solid"
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  mobileRoot: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingTop: Platform.OS === "ios" ? 54 : 36 },

  headerBlock: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: 2, marginTop: 4 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },

  sectionCard: {
    backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOW_NATIVE(COLORS.cyanGlow),
  },

  avatarCarousel: { gap: 12, paddingVertical: 10 },
  avatarBadgeTile: {
    width: 64, height: 64, borderRadius: RADII.md, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5, justifyContent: "center", alignItems: "center", position: "relative",
  },
  activeDot: { position: "absolute", bottom: 4, width: 6, height: 6, borderRadius: 3 },

  classGrid: { gap: 12, marginTop: 12 },
  classTile: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADII.md, padding: 14,
    borderWidth: 1.5,
  },
  classTileHeader: { flexDirection: "row", alignItems: "center" },
  classTileDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16 },
  bonusTag: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "rgba(245, 158, 11, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.pill },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  statBox: { alignItems: "center", flex: 1 },

  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.12)", padding: 12, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.red, marginBottom: 16 },
});
