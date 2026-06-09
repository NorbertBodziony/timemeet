import { View } from "react-native";
import { Text } from "heroui-native";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Terms of use",
    body: "MeetTime helps you organize meetups with people you already know. Use it kindly: only invite people who want to hear from you, and don't use it to harass, spam, or impersonate others. The app is provided as-is during the beta. We may update these terms; we'll flag anything important.",
  },
  {
    title: "Privacy",
    body: "We store only what's needed to run your meetups — your name, the plans and events you take part in, and your RSVPs. We don't sell your data. Analytics are off unless you opt in (Settings → Privacy & data). You can delete your account at any time, which removes your personal data.",
  },
  {
    title: "Cookies & local storage",
    body: "On the web we use essential cookies to keep you signed in. In the app we store a little data on your device (your session and, for guest poll voting, a local key so you can update your own votes). No third-party advertising trackers.",
  },
  {
    title: "Licenses",
    body: "MeetTime is built with open-source software, including React Native, Expo, and Convex, each under its own license. Emoji artwork is provided by the platform. We're grateful to these communities.",
  },
];

export default function Legal() {
  return (
    <Screen title="Legal" subtitle="The plain-language version." dismiss="back">
      <View className="gap-1">
        {SECTIONS.map((s, i) => (
          <View key={s.title}>
            <SectionHeader tight={i === 0}>{s.title}</SectionHeader>
            <Text type="body-sm" color="muted" className="leading-5">
              {s.body}
            </Text>
          </View>
        ))}
      </View>
      <Text type="body-xs" color="muted" align="center" className="mt-8">
        MeetTime · beta
      </Text>
    </Screen>
  );
}
