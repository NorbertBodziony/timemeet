import { Pressable, View } from "react-native";
import { Text } from "heroui-native";
import type { Doc } from "../../convex/_generated/dataModel";
import { formatDateTime } from "../lib/datetime";
import { RSVP, type HeroColor, type RsvpStatus } from "../lib/theme";

type Counts = Record<RsvpStatus, number>;

// HeroColor → Tailwind bg utility (literal classes so the compiler keeps them).
const STRIPE: Record<HeroColor, string> = {
  success: "bg-success",
  warning: "bg-warning",
  accent: "bg-accent",
  default: "bg-default",
  danger: "bg-danger",
};

// List card with a 3px RSVP/brand stripe (docs §16.5). "Not going" dims + strikes.
export function EventCard({
  event,
  counts,
  viewerStatus,
  onPress,
}: {
  event: Doc<"events">;
  counts?: Counts;
  viewerStatus?: RsvpStatus | null;
  onPress: () => void;
}) {
  const declined = viewerStatus === "not_going";
  const stripe = STRIPE[viewerStatus ? RSVP[viewerStatus].color : "accent"];
  const place = event.customAddress ?? event.placeId ?? "";

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-surface border border-border"
      style={{ opacity: declined ? 0.6 : 1 }}
    >
      <View className={`w-[3px] ${stripe}`} />
      <View className="flex-1 px-4 py-3">
        <Text
          type="h3"
          weight="bold"
          numberOfLines={1}
          style={declined ? { textDecorationLine: "line-through" } : undefined}
        >
          {event.title}
        </Text>
        <Text type="body-sm" color="muted" className="mt-0.5">
          {formatDateTime(event.startsAt)}
        </Text>
        {!!place && (
          <Text type="body-xs" color="muted" numberOfLines={1} className="mt-0.5">
            {place}
          </Text>
        )}
        {counts && (
          <Text type="body-xs" weight="semibold" className="text-success mt-1.5">
            {counts.going} going{counts.maybe ? ` · ${counts.maybe} maybe` : ""}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
