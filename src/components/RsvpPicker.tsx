import { Pressable, Text, View } from "react-native";
import { RSVP, RSVP_ACTIONS, type RsvpStatus } from "../lib/theme";

// The 5-status RSVP control (docs §3.3 / §16). Selected status fills with its
// color; "Not going" never reads as punishing (neutral, no red fill emphasis).
export function RsvpPicker({
  value,
  onChange,
}: {
  value: RsvpStatus | null;
  onChange: (status: RsvpStatus) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {RSVP_ACTIONS.map((status) => {
        const meta = RSVP[status];
        const active = value === status;
        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            className="flex-1 items-center rounded-xl border py-2.5"
            style={{
              backgroundColor: active ? meta.friendlyColor : "#FFFFFF",
              borderColor: active ? meta.friendlyColor : "rgba(15,26,0,0.12)",
            }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: active ? "#FFFFFF" : "rgba(15,26,0,0.7)" }}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
