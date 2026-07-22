import { Platform } from "react-native";

/**
 * Shadow Nexus Native Mobile Theme — Design Tokens.
 * Sleek dark OLED palette with 16px rounded mobile cards and cyan/green accents.
 */
export const COLORS = {
  bg: "#08090C",
  surface: "#12141C",
  surfaceElevated: "#1A1D28",
  surfaceGlass: "rgba(18, 20, 28, 0.95)",
  bottomBarBg: "#0E1017",
  headerBg: "#0E1017",
  border: "rgba(255, 255, 255, 0.08)",
  borderActive: "rgba(0, 240, 255, 0.4)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  cyan: "#00F0FF",
  green: "#00FF66",
  purple: "#A855F7",
  amber: "#F59E0B",
  red: "#EF4444",
  cyanGlow: "rgba(0, 240, 255, 0.3)",
  greenGlow: "rgba(0, 255, 102, 0.3)",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32 };

export const RADII = { none: 0, sm: 6, md: 12, lg: 16, pill: 999 };

const defaultShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
};

export const SHADOW_NATIVE = Object.assign(
  function (color?: string) {
    return {
      shadowColor: color || "#000000",
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    };
  },
  defaultShadow
);

export const SHADOW_NEON = (color: string) => ({
  shadowColor: color,
  shadowOpacity: 0.5,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
});

const SANS = Platform.select({ ios: "System", android: "sans-serif-medium", default: "sans-serif" });

export const FONT = {
  heading: SANS,
  body: SANS,
  bodyBold: SANS,
};
