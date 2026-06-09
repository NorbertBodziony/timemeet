import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useThemeColor } from "heroui-native";

const ICON: Record<string, string> = {
  "to-confirm": "◔",
  going: "✓",
  history: "≡",
  mine: "★",
};

function tabIcon(name: string) {
  return ({ color }: { color: ColorValue }) => (
    <Text style={{ color, fontSize: 18 }}>{ICON[name]}</Text>
  );
}

export default function TabsLayout() {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");
  const surface = useThemeColor("surface");
  const border = useThemeColor("border");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarStyle: { backgroundColor: surface, borderTopColor: border },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="to-confirm"
        options={{ title: "To confirm", tabBarIcon: tabIcon("to-confirm") }}
      />
      <Tabs.Screen
        name="going"
        options={{ title: "Going", tabBarIcon: tabIcon("going") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: tabIcon("history") }}
      />
      <Tabs.Screen
        name="mine"
        options={{ title: "My events", tabBarIcon: tabIcon("mine") }}
      />
    </Tabs>
  );
}
