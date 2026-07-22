import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NATIVE, SHADOW_NEON } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

function RequirementMet({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={15}
        color={met ? COLORS.green : COLORS.textMuted}
      />
      <MonoText style={[styles.reqText, { color: met ? COLORS.textPrimary : COLORS.textMuted }]}>
        {text}
      </MonoText>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [confirm, setC] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()\-=_+[\]{}|;:',.<>?/~`]/.test(password);

  const submit = async () => {
    setErr(null);
    if (!username || !email || !password) { setErr("All fields are required"); return; }
    if (username.length < 3) { setErr("Username must be at least 3 chars"); return; }
    if (!hasMinLen) { setErr("Password must be at least 8 characters"); return; }
    if (!hasUpper) { setErr("Password must contain at least one uppercase letter"); return; }
    if (!hasLower) { setErr("Password must contain at least one lowercase letter"); return; }
    if (!hasDigit) { setErr("Password must contain at least one digit"); return; }
    if (!hasSpecial) { setErr("Password must contain at least one special character"); return; }
    if (password !== confirm) { setErr("Passwords don't match"); return; }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      router.replace({ pathname: "/verify-email", params: { email: email.trim() } });
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onDemoRegister = async () => {
    setErr(null);
    setLoading(true);
    try {
      await register("Agent_Zero", "agent@nexus.io", "Demo1234!");
      router.replace({ pathname: "/verify-email", params: { email: "agent@nexus.io" } });
    } catch (e: any) {
      setErr(e?.message || "Demo signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mobileRoot}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header Block with Safe Top Padding */}
          <View style={styles.headerBlock}>
            <View style={styles.topBadgeRow}>
              <View style={styles.badgeIconBox}>
                <Ionicons name="person-add" size={20} color={COLORS.purple} />
              </View>
              <NeonLabel color={COLORS.purple}>{"// OPERATIVE_REGISTRATION"}</NeonLabel>
            </View>
            <TitleText style={styles.headerTitle}>NEW OPERATIVE</TitleText>
            <MutedText style={styles.headerSubtitle}>
              Initialize your operative profile. The Phantom Grid is waiting.
            </MutedText>
          </View>

          {/* Registration Form Card */}
          <View style={styles.formCard}>
            <CyberInput
              testID="register-username-input"
              label="USERNAME (CODENAME)"
              value={username}
              onChangeText={setU}
              placeholder="e.g. VEX_ZERO"
              autoCapitalize="none"
            />

            <CyberInput
              testID="register-email-input"
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={setE}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="agent@nexus.io"
            />

            <View style={{ position: "relative" }}>
              <CyberInput
                testID="register-password-input"
                label="PASSWORD"
                value={password}
                onChangeText={setP}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.cyan} />
              </TouchableOpacity>
            </View>

            {/* Password Requirements Checklist */}
            <View style={styles.reqCard}>
              <RequirementMet met={hasMinLen} text="At least 8 characters" />
              <RequirementMet met={hasUpper} text="At least one uppercase letter" />
              <RequirementMet met={hasLower} text="At least one lowercase letter" />
              <RequirementMet met={hasDigit} text="At least one digit" />
              <RequirementMet met={hasSpecial} text="At least one special character" />
            </View>

            <View style={{ position: "relative" }}>
              <CyberInput
                testID="register-confirm-password-input"
                label="CONFIRM PASSWORD"
                value={confirm}
                onChangeText={setC}
                secureTextEntry={!showConfirm}
                placeholder="••••••••"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
                activeOpacity={0.7}
              >
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.cyan} />
              </TouchableOpacity>
            </View>

            {err ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.red} style={{ marginRight: 6 }} />
                <MonoText style={{ color: COLORS.red, fontSize: 12, flex: 1 }}>{err}</MonoText>
              </View>
            ) : null}

            <View style={{ marginTop: 24, gap: 10 }}>
              <NeonButton
                testID="register-submit-button"
                label={loading ? "INITIALIZING..." : "REGISTER OPERATIVE"}
                onPress={submit}
                color={COLORS.purple}
                variant="solid"
                disabled={loading}
              />
              <NeonButton
                testID="register-demo-button"
                label="⚡ QUICK DEMO SIGNUP"
                onPress={onDemoRegister}
                color={COLORS.cyan}
                variant="outline"
                disabled={loading}
              />
            </View>

            <View style={styles.footerRow}>
              <Link href="/login" asChild>
                <TouchableOpacity testID="back-to-login-link" activeOpacity={0.7}>
                  <MonoText style={{ color: COLORS.cyan, fontSize: 13, fontWeight: "800" }}>
                    ← Back to Login
                  </MonoText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileRoot: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 64 : 44, // Safe area top inset space to avoid status bar overlap
    paddingBottom: 40,
  },

  headerBlock: { marginBottom: 20 },
  topBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  badgeIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 1.5, borderColor: COLORS.purple, justifyContent: "center", alignItems: "center",
    ...SHADOW_NEON(COLORS.purple),
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: 2 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },

  formCard: {
    backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.lg, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NEON(COLORS.purpleGlow),
  },

  eyeBtn: { position: "absolute", right: 12, top: 38, padding: 8 },

  reqCard: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: RADII.md, padding: 12,
    marginVertical: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  reqRow: { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  reqText: { fontSize: 11, marginLeft: 8 },

  errorBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: 12, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.red, marginTop: 12,
  },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
});
