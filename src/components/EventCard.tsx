import { Pressable, Text, View } from "react-native";
import type { Doc } from "../../convex/_generated/dataModel";
import { formatDateTime } from "../lib/datetime";
import { RSVP, type RsvpStatus } from "../lib/theme";

type Counts = Record<RsvpStatus, number>;

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
  const stripe = viewerStatus ? RSVP[viewerStatus].friendlyColor : "#5DA802";
  const place = event.customAddress ?? event.placeId ?? "";

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-surface border border-brand-evergreen/10"
      style={{ opacity: declined ? 0.6 : 1 }}
    >
      <View style={{ width: 3, backgroundColor: stripe }} />
      <View className="flex-1 px-4 py-3">
        <Text
          className="text-brand-evergreen text-[17px] font-bold"
          style={declined ? { textDecorationLine: "line-through" } : undefined}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <Text className="text-brand-evergreen/65 text-[13px] mt-0.5">
          {formatDateTime(event.startsAt)}
        </Text>
        {!!place && (
          <Text className="text-brand-evergreen/45 text-[12px] mt-0.5" numberOfLines={1}>
            {place}
          </Text>
        )}
        {counts && (
          <Text className="text-rsvp-going text-[12px] font-semibold mt-1.5">
            {counts.going} going
            {counts.maybe ? ` · ${counts.maybe} maybe` : ""}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
