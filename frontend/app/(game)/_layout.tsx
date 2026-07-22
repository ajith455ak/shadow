import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, SHADOW_NEON } from "@/src/theme";

export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bottomBarBg,
          borderTopColor: COLORS.border,
          borderWidth: 1.5,
          borderColor: "rgba(0, 240, 255, 0.25)",
          position: "absolute",
          bottom: Platform.OS === "ios" ? 20 : 12,
          left: 16,
          right: 16,
          borderRadius: 28,
          height: 64,
          paddingBottom: Platform.OS === "ios" ? 10 : 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: COLORS.cyan,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontFamily: FONT.bodyBold, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "HQ",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-dashboard",
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          title: "Story",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "git-network" : "git-network-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-story",
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "rocket" : "rocket-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-missions",
        }}
      />
      <Tabs.Screen
        name="npcs"
        options={{
          title: "NPCs",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-npcs",
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Gear",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-inventory",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={focused ? 24 : size} color={color} />
          ),
          tabBarTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
