import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Text, useThemeColor } from "heroui-native";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { GRADIENTS, RSVP, RSVP_ACTIONS, RSVP_COLORS, type RsvpStatus } from "../lib/theme";
import type { IconName } from "../lib/icons";
import { pluralCategory } from "../lib/i18n";
import { useT } from "../providers/LanguageProvider";

export type RsvpFilter = RsvpStatus | null; // null = all

// The active pill: BRIGHT gradient with a slow glow pulse (brand sheet §05).
function ActivePill({ label, icon }: { label: string; icon?: IconName }) {
  const glow = useSharedValue(0.25);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(0.55, { duration: 1000 }), withTiming(0.25, { duration: 1000 })),
      -1
    );
  }, [glow]);
  const glowing = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
  }));
  return (
    <Animated.View
      style={[
        {
          borderRadius: 999,
          shadowColor: "#7ED600",
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        },
        glowing,
      ]}
    >
      <LinearGradient
        colors={[...GRADIENTS.bright.colors]}
        locations={[...GRADIENTS.bright.locations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon && <Icon name={icon} size={15} color="#FFFFFF" />}
        <Text type="body-sm" weight="semibold" style={{ color: "#FFFFFF" }}>
          {label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

// FilterBar (§05) — segmented pill bar filtering a list by RSVP status.
// Pair with <ResultCount/> when the filter is active.
export function FilterBar({
  value,
  onChange,
}: {
  value: RsvpFilter;
  onChange: (next: RsvpFilter) => void;
}) {
  const { t } = useT();
  const foreground = useThemeColor("foreground");
  const options: { key: RsvpFilter; label: string; icon?: IconName }[] = [
    { key: null, label: t("filter.all") },
    ...[...RSVP_ACTIONS, "no_response" as RsvpStatus].map((s) => ({
      key: s as RsvpFilter,
      label: t(RSVP[s].labelKey),
      icon: RSVP[s].ion,
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
    >
      {options.map((o) => {
        const active = value === o.key;
        if (active) {
          return (
            <PressableScale key={o.key ?? "all"} haptic={false} onPress={() => {}}>
              <ActivePill label={o.label} icon={o.icon} />
            </PressableScale>
          );
        }
        return (
          <PressableScale
            key={o.key ?? "all"}
            onPress={() => onChange(o.key)}
            style={{ borderRadius: 999 }}
          >
            <View className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2 bg-surface border border-border">
              {o.icon && (
                <Icon
                  name={o.icon}
                  size={15}
                  color={o.key ? RSVP_COLORS[o.key].fill : foreground}
                />
              )}
              <Text type="body-sm" weight="semibold">
                {o.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ResultCount (§05) — shows how many rows match when the filter is narrowed.
export function ResultCount({ count, filter }: { count: number; filter: RsvpFilter }) {
  const { t, lang } = useT();
  if (!filter) return null;
  const c = RSVP_COLORS[filter];
  const noun = t(`filter.meetup.${pluralCategory(lang, count)}`);
  return (
    <View className="flex-row mt-3">
      <View
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{ backgroundColor: c.soft }}
      >
        <Icon name={RSVP[filter].ion} size={14} color={c.softFg} />
        <Text type="body-xs" weight="semibold" style={{ color: c.softFg }}>
          {count} {noun} · {t(RSVP[filter].labelKey).toLowerCase()}
        </Text>
      </View>
    </View>
  );
}
