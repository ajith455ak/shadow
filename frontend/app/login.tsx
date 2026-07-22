import { useState } from "react";
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Switch, TouchableOpacity, View,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADII, SHADOW_NATIVE, SHADOW_NEON } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CyberInput } from "@/src/components/CyberInput";
import { NeonButton } from "@/src/components/NeonButton";
import { MonoText, NeonLabel, TitleText, MutedText } from "@/src/components/Typography";

import * as LocalAuthentication from "expo-local-authentication";

const BG = "https://static.prod-images.emergentagent.com/jobs/7499d0b0-0ff4-4057-9ab7-0aae648122c0/images/d1972f474c5c0df584ef8e78d53aee13c9478013e75e7989b8dbb840f6bea3cb.png";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    setErr(null);
    if (!email || !password) { setErr("Enter your credentials"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onDemoLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await login("agent@nexus.io", "Demo1234!", true);
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setErr(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback simulation for dev/emulator environments
        await login("agent@nexus.io", "Demo1234!", true);
        router.replace("/dashboard");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate Operative Identity",
        fallbackLabel: "Enter Password",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        await login("agent@nexus.io", "Demo1234!", true);
        router.replace("/dashboard");
      }
    } catch (e: any) {
      setErr(e?.message || "Biometric authentication failed");
    }
  };

  return (
    <View style={styles.mobileRoot}>
      <Image source={{ uri: BG }} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.darkOverlay} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Top Mobile Status Header */}
          <View style={styles.topBadgeRow}>
            <View style={styles.fingerprintBadge}>
              <Ionicons name="finger-print" size={24} color={COLORS.cyan} />
            </View>
            <NeonLabel color={COLORS.cyan}>{"// SECURE_AUTH.MOB"}</NeonLabel>
          </View>

          {/* Brand Heading */}
          <View style={styles.brandContainer}>
            <TitleText style={styles.brandTitle}>SHADOW{"\n"}NEXUS</TitleText>
            <MutedText style={styles.brandSubtitle}>
              Mobile Stealth Network Access. Enter your operative credentials to connect.
            </MutedText>
          </View>

          {/* Mobile Login Touch Form */}
          <View style={styles.mobileFormCard}>
            <CyberInput
              testID="login-email-input"
              label="OPERATIVE EMAIL"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="agent@nexus.io"
            />

            <View style={{ position: "relative" }}>
              <CyberInput
                testID="login-password-input"
                label="ENCRYPTED PASSWORD"
                value={password}
                onChangeText={setPassword}
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

            <View style={styles.rememberRow}>
              <TouchableOpacity
                testID="login-remember-toggle"
                onPress={() => setRemember(!remember)}
                style={styles.switchTouch}
                activeOpacity={0.7}
              >
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  trackColor={{ false: COLORS.surfaceElevated, true: COLORS.cyan }}
                  thumbColor={COLORS.bg}
                />
                <MonoText style={{ marginLeft: 10, color: COLORS.textSecondary, fontSize: 12 }}>
                  Remember Device
                </MonoText>
              </TouchableOpacity>

              <Link href="/forgot-password" asChild>
                <TouchableOpacity testID="forgot-password-link" activeOpacity={0.7}>
                  <MonoText style={{ color: COLORS.purple, fontSize: 12, fontWeight: "700" }}>Forgot?</MonoText>
                </TouchableOpacity>
              </Link>
            </View>

            {err ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.red} style={{ marginRight: 6 }} />
                <MonoText style={{ color: COLORS.red, fontSize: 12, flex: 1 }}>{err}</MonoText>
              </View>
            ) : null}

            <View style={{ marginTop: 20, gap: 10 }}>
              <NeonButton
                testID="login-submit-button"
                label={loading ? "AUTHENTICATING..." : "LOGIN TO GRID"}
                onPress={onSubmit}
                color={COLORS.cyan}
                variant="solid"
                disabled={loading}
              />
              <NeonButton
                testID="login-biometric-button"
                label="👆 USE BIOMETRIC LOGIN"
                onPress={handleBiometricAuth}
                color={COLORS.green}
                variant="solid"
                disabled={loading}
              />
              <NeonButton
                testID="login-demo-button"
                label="⚡ QUICK DEMO ACCESS"
                onPress={onDemoLogin}
                color={COLORS.purple}
                variant="outline"
                disabled={loading}
              />
            </View>

            <View style={styles.footerRow}>
              <MutedText style={{ fontSize: 13 }}>New Operative? </MutedText>
              <Link href="/register" asChild>
                <TouchableOpacity testID="register-link" activeOpacity={0.7}>
                  <MonoText style={{ color: COLORS.cyan, fontSize: 13, fontWeight: "800" }}>
                    REGISTER NOW →
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
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 9, 12, 0.85)" },
  scrollContent: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 },

  topBadgeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  fingerprintBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderWidth: 1.5, borderColor: COLORS.cyan, justifyContent: "center", alignItems: "center",
    ...SHADOW_NEON(COLORS.cyan),
  },

  brandContainer: { marginBottom: 28 },
  brandTitle: { fontSize: 36, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: 3, lineHeight: 42 },
  brandSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20 },

  mobileFormCard: {
    backgroundColor: COLORS.surfaceGlass, borderRadius: RADII.lg, padding: 24,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW_NEON(COLORS.cyanGlow),
  },

  eyeBtn: { position: "absolute", right: 12, top: 38, padding: 8 },
  rememberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 10 },
  switchTouch: { flexDirection: "row", alignItems: "center" },

  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.12)", padding: 12, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.red, marginTop: 10 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
});
