import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT } from "@/src/theme";
import { api } from "@/src/api/client";
import { MonoText, MutedText, NeonLabel, TitleText } from "@/src/components/Typography";

type Msg = { role: "user" | "assistant"; content: string; ts?: string };

export default function NPCDialogue() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [npc, setNpc] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const n = await api.get<any>(`/npcs/${id}`);
        setNpc(n);
        const hist = await api.get<{ messages: Msg[] }>(`/npcs/${id}/history`);
        if (hist.messages?.length) {
          setMessages(hist.messages);
        } else {
          setMessages([{ role: "assistant", content: n.intro }]);
        }
      } catch { /* noop */ }
    })();
  }, [id]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/npcs/chat", { npc_id: id, message: text });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "[Connection lost. Static interference.]" }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!npc) return <View style={styles.root}><MutedText style={{ padding: 24 }}>Connecting...</MutedText></View>;

  const quickReplies = [
    "What's the situation?",
    "Brief me on the Phantom Grid.",
    "Any tips for a new operative?",
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { borderColor: npc.color }]}>
        <Pressable testID="npc-back" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.cyan} />
        </Pressable>
        <View style={[styles.portrait, { borderColor: npc.color, shadowColor: npc.color }]}>
          <Ionicons name={npc.icon as any} size={28} color={npc.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <MonoText style={{ color: npc.color, fontSize: 13, fontWeight: "700" }}>{npc.name}</MonoText>
          <MutedText style={{ fontSize: 10 }}>{npc.role}</MutedText>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={{ padding: 16 }}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgRow, m.role === "user" && { alignItems: "flex-end" }]}>
            <View style={[
              styles.bubble,
              m.role === "user"
                ? { borderColor: COLORS.cyan, backgroundColor: "rgba(0,240,255,0.08)" }
                : { borderColor: npc.color, backgroundColor: "rgba(10,10,15,0.85)" },
            ]}>
              {m.role === "assistant" ? (
                <MonoText style={{ color: npc.color, fontSize: 10, marginBottom: 4, letterSpacing: 1.4, textTransform: "uppercase" }}>
                  {npc.name}
                </MonoText>
              ) : null}
              <MonoText style={{ color: COLORS.textPrimary, fontSize: 13, lineHeight: 19 }}>{m.content}</MonoText>
            </View>
          </View>
        ))}
        {sending ? (
          <View style={[styles.bubble, { borderColor: npc.color, alignSelf: "flex-start" }]}>
            <ActivityIndicator color={npc.color} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.quickRow}>
        {quickReplies.map((q) => (
          <Pressable key={q} testID={`quick-${q.slice(0, 6)}`} onPress={() => send(q)} style={[styles.quickReply, { borderColor: npc.color }]}>
            <MonoText style={{ color: npc.color, fontSize: 11 }} numberOfLines={1}>{q}</MonoText>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputRow, { borderColor: npc.color }]}>
          <TextInput
            testID="npc-message-input"
            value={input}
            onChangeText={setInput}
            placeholder="Transmit message..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable testID="npc-send-button" onPress={() => send(input)} disabled={sending || !input.trim()} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color={sending ? COLORS.textMuted : npc.color} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, backgroundColor: COLORS.surface,
  },
  portrait: {
    width: 44, height: 44, borderWidth: 2, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated, shadowOpacity: 0.6, shadowRadius: 8, marginLeft: 12,
  },
  chat: { flex: 1 },
  msgRow: { marginBottom: 12 },
  bubble: { padding: 12, borderWidth: 1, maxWidth: "85%" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 8 },
  quickReply: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "32%" },
  inputRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, padding: 8, backgroundColor: COLORS.surface },
  input: { flex: 1, color: COLORS.textPrimary, fontFamily: FONT.body, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sendBtn: { padding: 10 },
});
