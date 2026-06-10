import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import type { ColorValue } from "react-native";
import { BlurView } from "expo-blur";
import { useQuery } from "convex/react";
import { useThemeColor } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { tap } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

type IonName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IonName, filled: IonName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={23} color={color as string} />
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const surface = useThemeColor("surface");
  const border = useThemeColor("border");

  const unread = useQuery(
    api.notifications.unreadCount,
    currentUser ? { userId: currentUser._id } : "skip"
  );

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
        name="events"
        options={{
          title: t("tabs.events"),
          tabBarIcon: tabIcon("calendar-outline", "calendar"),
        }}
      />
      <Tabs.Screen
        name="new-plan"
        options={{
          title: t("tabs.newPlan"),
          tabBarIcon: tabIcon("add-circle-outline", "add-circle"),
        }}
        listeners={{
          // The center tab is an action, not a destination — open the chooser.
          tabPress: (e) => {
            e.preventDefault();
            router.push("/create" as never);
          },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("notifScreen.title"),
          tabBarIcon: tabIcon("notifications-outline", "notifications"),
          tabBarBadge: unread ? unread : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("settings.profile"),
          tabBarIcon: tabIcon("person-circle-outline", "person-circle"),
        }}
      />
    </Tabs>
  );
}
