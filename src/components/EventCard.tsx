import { Image, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "heroui-native";
import type { Doc } from "../../convex/_generated/dataModel";
import { formatTime } from "../lib/datetime";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { StarRating } from "./StarRating";
import { cardShadow } from "../lib/ui";
import { useT } from "../providers/LanguageProvider";
import { GRADIENTS, RSVP, RSVP_COLORS, type RsvpStatus } from "../lib/theme";

type Counts = Record<RsvpStatus, number>;
const DAYS: Record<string, string[]> = {
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  pl: ["NDZ", "PON", "WT", "ŚR", "CZW", "PT", "SOB"],
};

function isToday(ms: number): boolean {
  const a = new Date(ms);
  const b = new Date();
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Event list card. Upcoming: accent date tile + counts + RSVP status pill in
// the brand palette (§03); a today-stripe gradient marks events happening
// today (§04). Past: muted, with the star rating.
export function EventCard({
  event,
  counts,
  viewerStatus,
  past,
  rating,
  coverUrl,
  onPress,
}: {
  event: Doc<"events">;
  counts?: Counts;
  viewerStatus?: RsvpStatus | null;
  past?: boolean;
  rating?: { average: number; count: number };
  coverUrl?: string | null;
  onPress: () => void;
}) {
  const { t, lang } = useT();
  const declined = viewerStatus === "not_going";
  const d = new Date(event.startsAt);
  const place = event.customAddress ?? event.placeId ?? "";
  const status = viewerStatus ? RSVP[viewerStatus] : null;
  const statusColor = viewerStatus ? RSVP_COLORS[viewerStatus] : null;
  const today = !past && isToday(event.startsAt);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      layout={LinearTransition.springify().damping(18)}
    >
    <PressableScale
      onPress={onPress}
      className="mb-3"
      style={{ opacity: past || declined ? 0.65 : 1 }}
    >
      <View
        className="rounded-2xl bg-surface px-3.5 py-3.5 overflow-hidden"
        style={cardShadow}
      >
        {/* §04 STRIPE — it's happening today. */}
        {today && (
          <LinearGradient
            colors={[...GRADIENTS.stripe.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4 }}
          />
        )}
        <View className="flex-row items-center gap-3.5">
          {/* Date tile — neutral when past */}
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center ${
              past ? "bg-default-soft" : "bg-accent-soft"
            }`}
          >
            {past ? (
              <Icon name="checkmark-done" size={20} tint="muted" />
            ) : (
              <>
                <Text type="body-xs" weight="semibold" className="text-accent-soft-foreground">
                  {today ? t("common.todayTile") : DAYS[lang][d.getDay()]}
                </Text>
                <Text type="h3" weight="bold" className="text-accent-soft-foreground leading-none">
                  {d.getDate()}
                </Text>
              </>
            )}
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

            {past ? (
              <View className="flex-row items-center gap-2 mt-1">
                {rating && rating.count > 0 ? (
                  <>
                    <StarRating value={rating.average} size={13} />
                    <Text type="body-xs" color="muted">
                      {rating.average} · {rating.count}
                    </Text>
                  </>
                ) : (
                  <Text type="body-xs" color="muted">
                    {t("ratings.tapToRate")}
                  </Text>
                )}
              </View>
            ) : (
              counts && (
                <View className="flex-row items-center gap-1 mt-1">
                  <Icon name="people-outline" size={13} tint="muted" />
                  <Text type="body-xs" color="muted">
                    {t("event.goingMaybe", { going: counts.going, maybe: counts.maybe })}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Cover thumbnail */}
          {!!coverUrl && (
            <Image
              source={{ uri: coverUrl }}
              className="rounded-xl"
              style={{ width: 44, height: 44 }}
              resizeMode="cover"
            />
          )}

          {/* Status pill in the RSVP palette (upcoming only) */}
          {!past && status && statusColor && (
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: statusColor.soft }}
            >
              <Text type="body-xs" weight="semibold" style={{ color: statusColor.softFg }}>
                {t(status.labelKey)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
    </Animated.View>
  );
}
