import { Platform } from "react-native";

/**
 * WhatsApp Android Theme — Design Tokens.
 * Dark Mode WhatsApp Android palette with `#0b141a` base and `#25d366` green accents.
 */
export const COLORS = {
  bg: "#0b141a",
  surface: "#111b21",
  surfaceElevated: "#1f2c34",
  surfaceGlass: "rgba(17, 27, 33, 0.9)",
  headerBg: "#121b22",
  border: "#222d34",
  borderActive: "#25d366",
  borderPurple: "rgba(37, 211, 102, 0.4)",
  textPrimary: "#e9edef",
  textSecondary: "#8696a0",
  textMuted: "#667781",
  cyan: "#00a884",
  green: "#25d366",
  purple: "#7000ff",
  amber: "#ffb800",
  red: "#f15c6d",
  cyanGlow: "rgba(0, 168, 132, 0.3)",
  greenGlow: "rgba(37, 211, 102, 0.4)",
  purpleGlow: "rgba(112, 0, 255, 0.3)",
  redGlow: "rgba(241, 92, 109, 0.3)",
  amberGlow: "rgba(255, 184, 0, 0.3)",
  outgoingBubble: "#005c4b",
  incomingBubble: "#202c33",
  fabBg: "#25d366",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const RADII = { none: 0, sm: 4, md: 8, lg: 12, pill: 999 };

export const SHADOW_NEON = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.5,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
});

const SANS = Platform.select({ ios: "System", android: "sans-serif-medium", default: "Roboto, sans-serif" });

export const FONT = {
  heading: SANS,
  body: SANS,
  bodyBold: SANS,
};
