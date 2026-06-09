import { Pressable, View } from "react-native";
import { Card, Chip, Text } from "heroui-native";
import type { Doc } from "../../convex/_generated/dataModel";
import { formatTime } from "../lib/datetime";
import { Icon } from "./Icon";
import { RSVP, type RsvpStatus } from "../lib/theme";

type Counts = Record<RsvpStatus, number>;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Event list card: leading date tile + title/meta + status chip. Reads like a
// native calendar list, not a generic box.
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
  const d = new Date(event.startsAt);
  const place = event.customAddress ?? event.placeId ?? "";
  const status = viewerStatus ? RSVP[viewerStatus] : null;

  return (
    <Pressable onPress={onPress} className="mb-3" style={{ opacity: declined ? 0.55 : 1 }}>
      <Card>
        <Card.Body className="flex-row items-center gap-3 py-3">
          {/* Date tile */}
          <View className="w-12 h-12 rounded-xl bg-accent-soft items-center justify-center">
            <Text type="body-xs" weight="semibold" className="text-accent-soft-foreground">
              {DAYS[d.getDay()].toUpperCase()}
            </Text>
            <Text type="h3" weight="bold" className="text-accent-soft-foreground leading-none">
              {d.getDate()}
            </Text>
          </View>

          {/* Title + meta */}
          <View className="flex-1">
            <Text
              type="h3"
              weight="bold"
              numberOfLines={1}
              style={declined ? { textDecorationLine: "line-through" } : undefined}
            >
              {event.title}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Icon name="time-outline" size={13} tint="muted" />
              <Text type="body-xs" color="muted">
                {formatTime(event.startsAt)}
              </Text>
              {!!place && (
                <>
                  <Icon name="location-outline" size={13} tint="muted" />
                  <Text type="body-xs" color="muted" numberOfLines={1} className="flex-1">
                    {place}
                  </Text>
                </>
              )}
            </View>
            {counts && (
              <View className="flex-row items-center gap-1 mt-1">
                <Icon name="people-outline" size={13} tint="success" />
                <Text type="body-xs" weight="semibold" className="text-success">
                  {counts.going} going{counts.maybe ? ` · ${counts.maybe} maybe` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Status chip */}
          {status && (
            <Chip color={status.color} variant="soft" size="sm">
              <Chip.Label>{status.label}</Chip.Label>
            </Chip>
          )}
        </Card.Body>
      </Card>
    </Pressable>
  );
}
