import { StatusPills, type PillOption } from "./StatusPills";
import { RSVP, RSVP_ACTIONS, RSVP_COLORS, type RsvpStatus } from "../lib/theme";

// The 5-status RSVP control (docs §3.3, brand sheet §03): a 2×2 set of status
// pills in the dedicated RSVP palette. Copy stays non-punishing.
const OPTIONS: PillOption[] = RSVP_ACTIONS.map((status) => ({
  value: status,
  label: RSVP[status].label,
  fill: RSVP_COLORS[status].fill,
  icon: RSVP[status].ion,
}));

export function RsvpPicker({
  value,
  onChange,
}: {
  value: RsvpStatus | null;
  onChange: (status: RsvpStatus) => void;
}) {
  return (
    <StatusPills
      options={OPTIONS}
      value={value}
      onChange={(v) => onChange(v as RsvpStatus)}
      columns={2}
    />
  );
}
