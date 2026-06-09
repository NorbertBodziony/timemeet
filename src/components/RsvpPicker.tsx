import { View } from "react-native";
import { Chip } from "heroui-native";
import { RSVP, RSVP_ACTIONS, type RsvpStatus } from "../lib/theme";

// The 5-status RSVP control (docs §3.3 / §16) using HeroUI Chips. Selected = filled
// with its semantic color; "Not going" is neutral ('default'), never punishing.
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
          <Chip
            key={status}
            color={meta.color}
            variant={active ? "primary" : "tertiary"}
            size="md"
            onPress={() => onChange(status)}
            className="flex-1 justify-center"
          >
            <Chip.Label>{meta.label}</Chip.Label>
          </Chip>
        );
      })}
    </View>
  );
}
