import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { COLORS, FONT } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [confirm, setC] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!username || !email || !password) { setErr("All fields are required"); return; }
    if (username.length < 3) { setErr("Username must be at least 3 chars"); return; }
    if (password.length < 6) { setErr("Password must be at least 6 chars"); return; }
    if (password !== confirm) { setErr("Passwords don't match"); return; }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      router.replace("/character-creation");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <NeonLabel color={COLORS.purple}>// new_operative.init</NeonLabel>
          <TitleText style={styles.title}>RECRUIT{"\n"}PROTOCOL</TitleText>
          <MutedText style={{ marginVertical: 12 }}>
            Initialize your operative profile. The grid is waiting.
          </MutedText>

          <View style={styles.form}>
            <CyberInput testID="register-username-input" label="Username (codename)" value={username} onChangeText={setU} autoCapitalize="none" placeholder="ghost_07" />
            <CyberInput testID="register-email-input" label="Email" value={email} onChangeText={setE} keyboardType="email-address" autoCapitalize="none" placeholder="agent@nexus.io" />
            <CyberInput testID="register-password-input" label="Password" value={password} onChangeText={setP} secureTextEntry placeholder="At least 6 chars" />
            <CyberInput testID="register-confirm-input" label="Confirm Password" value={confirm} onChangeText={setC} secureTextEntry placeholder="Repeat password" />

            {err ? <MonoText style={{ color: COLORS.red, marginBottom: 12, fontSize: 12 }}>{err}</MonoText> : null}

            <NeonButton testID="register-submit-button" label="Initialize" onPress={submit} loading={loading} color={COLORS.purple} variant="solid" />

            <Link href="/login" asChild>
              <Pressable testID="go-to-login" style={{ marginTop: 18, alignItems: "center" }}>
                <MonoText style={{ color: COLORS.cyan, fontSize: 12 }}>← Back to Login</MonoText>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  title: { fontSize: 38, color: COLORS.purple, marginTop: 4, lineHeight: 42, fontFamily: FONT.heading, fontWeight: "900", letterSpacing: 4 },
  form: { backgroundColor: "rgba(10,10,15,0.7)", borderWidth: 1, borderColor: "rgba(157,0,255,0.25)", padding: 24, marginTop: 18 },
});
