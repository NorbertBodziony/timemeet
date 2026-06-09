import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5DA802",
        tabBarInactiveTintColor: "rgba(15,26,0,0.4)",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "rgba(15,26,0,0.08)",
        },
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
