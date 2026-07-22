import { Platform } from "react-native";

/**
 * Shadow Nexus Premium Native Mobile Theme — Design System Tokens.
 * Deep OLED cyberpunk palette, 20px rounded glass cards, and neon glow effects.
 */
export const COLORS = {
  bg: "#05060A",
  surface: "#0C101A",
  surfaceElevated: "#141A2B",
  surfaceGlass: "rgba(16, 20, 32, 0.88)",
  bottomBarBg: "rgba(12, 16, 26, 0.95)",
  headerBg: "#090C14",
  border: "rgba(0, 240, 255, 0.15)",
  borderActive: "rgba(0, 240, 255, 0.5)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  cyan: "#00F0FF",
  green: "#00FF88",
  purple: "#B026FF",
  amber: "#FFB000",
  red: "#FF3366",
  cyanGlow: "rgba(0, 240, 255, 0.35)",
  greenGlow: "rgba(0, 255, 136, 0.35)",
  purpleGlow: "rgba(176, 38, 255, 0.35)",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32 };

export const RADII = { none: 0, sm: 6, md: 12, lg: 16, xl: 20, pill: 999 };

const defaultShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.4,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};

export const SHADOW_NATIVE = Object.assign(
  function (color?: string) {
    return {
      shadowColor: color || "#000000",
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    };
  },
  defaultShadow
);

export const SHADOW_NEON = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.55,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
});

const SANS = Platform.select({ ios: "System", android: "sans-serif-medium", default: "sans-serif" });

export const FONT = {
  heading: SANS,
  body: SANS,
  bodyBold: SANS,
};
