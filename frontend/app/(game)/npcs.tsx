import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

export default function NPCList() {
  const router = useRouter();
  const [npcs, setNpcs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try { setNpcs(await api.get<any[]>("/npcs")); } catch { /* noop */ }
    })();
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <NeonLabel color={COLORS.green}>// contacts.encrypted</NeonLabel>
      <TitleText style={styles.title}>NETWORK</TitleText>
      <MutedText style={{ marginBottom: 18 }}>Operatives, mentors, and ghosts. Tap to engage.</MutedText>

      {npcs.map((n) => (
        <Pressable
          key={n.id}
          testID={`npc-${n.id}`}
          style={[styles.card, { borderColor: n.color, shadowColor: n.color }]}
          onPress={() => router.push(`/npc/${n.id}`)}
        >
          <View style={[styles.portrait, { borderColor: n.color }]}>
            <Ionicons name={n.icon as any} size={32} color={n.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <MonoText style={{ color: n.color, fontSize: 15, fontWeight: "700" }}>{n.name}</MonoText>
            <MutedText style={{ fontSize: 11, marginTop: 2 }}>{n.role}</MutedText>
            <MonoText style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 8, fontStyle: "italic" }} numberOfLines={2}>
              "{n.intro}"
            </MonoText>
          </View>
          <Ionicons name="chatbubbles" size={20} color={n.color} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 40 },
  title: { color: COLORS.green, fontSize: 28, letterSpacing: 3, marginTop: 4, fontFamily: FONT.heading, fontWeight: "900" },
  card: {
    flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, marginBottom: 12,
    backgroundColor: COLORS.surface, shadowOpacity: 0.3, shadowRadius: 12,
  },
  portrait: {
    width: 64, height: 64, borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
  },
});
