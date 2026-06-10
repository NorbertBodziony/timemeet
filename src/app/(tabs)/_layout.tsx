import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import type { ColorValue } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeColor } from "heroui-native";
import { ICONS } from "../../lib/icons";
import { tap } from "../../lib/haptics";

type IonName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IonName, filled: IonName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={23} color={color as string} />
  );
}

export default function TabsLayout() {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const surface = useThemeColor("surface");
  const border = useThemeColor("border");

  return (
    <Tabs
      screenListeners={{ tabPress: () => tap() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        // Translucent frosted bar (iOS); content scrolls under it.
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : surface,
          borderTopColor: border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarBackground:
          Platform.OS === "ios"
            ? () => (
                <BlurView
                  tint="systemChromeMaterialLight"
                  intensity={80}
                  style={StyleSheet.absoluteFill}
                />
              )
            : undefined,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="to-confirm"
        options={{
          title: "To confirm",
          tabBarIcon: tabIcon(ICONS.toConfirm, ICONS.toConfirmActive),
        }}
      />
      <Tabs.Screen
        name="going"
        options={{ title: "Going", tabBarIcon: tabIcon(ICONS.going, ICONS.goingActive) }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: tabIcon(ICONS.history, ICONS.historyActive) }}
      />
      <Tabs.Screen
        name="mine"
        options={{ title: "My events", tabBarIcon: tabIcon(ICONS.mine, ICONS.mineActive) }}
      />
    </Tabs>
  );
}
