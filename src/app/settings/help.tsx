import { Linking, View } from "react-native";
import { Text } from "heroui-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SurfaceCard } from "../../components/SurfaceCard";

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do Plan Polls work?",
    a: "Drop a few times, share the link, and your crew taps yes / maybe / no — no account needed to vote. When a time wins, turn it into a meetup in one tap.",
  },
  {
    q: "What do the 5 RSVP statuses mean?",
    a: "Going, Maybe, Waitlist, Not going, and No response. They let people answer honestly — “can't make it this time” is never a big deal.",
  },
  {
    q: "Can I invite people who don't have the app?",
    a: "Yes — share a poll or event link, or your QR code. They can vote and RSVP from the link.",
  },
  {
    q: "Will I get spammed with notifications?",
    a: "No. Only a few that affect your plans (new invite, poll resolved, event off, 2h before). You can fine-tune them in Settings → Notifications.",
  },
];

export default function Help() {
  return (
    <Screen title="Help" subtitle="Quick answers — and we're a tap away." dismiss="back">
      <SectionHeader tight>FAQ</SectionHeader>
      <View className="gap-2.5">
        {FAQ.map((f) => (
          <SurfaceCard key={f.q} className="gap-1.5 py-3.5">
            <Text weight="semibold">{f.q}</Text>
            <Text type="body-sm" color="muted" className="leading-5">
              {f.a}
            </Text>
          </SurfaceCard>
        ))}
      </View>

      <SectionHeader>Still stuck?</SectionHeader>
      <Text color="muted" className="mb-3 leading-5">
        Tell us what happened and what you expected — we read every message.
      </Text>
      <PrimaryButton
        label="Contact us"
        onPress={() => Linking.openURL("mailto:hej@meettime.app?subject=MeetTime%20help")}
      />
    </Screen>
  );
}
