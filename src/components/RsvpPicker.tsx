import { StatusPills, type PillOption } from "./StatusPills";
import { RSVP, RSVP_ACTIONS, type RsvpStatus } from "../lib/theme";

// The 5-status RSVP control (docs §3.3 / §16): a 2×2 set of status pills.
// "Not going" stays neutral (default) — never punishing.
// RSVP_ACTIONS only ever use success / warning / accent / default (never danger).
const OPTIONS: PillOption[] = RSVP_ACTIONS.map((status) => ({
  value: status,
  label: RSVP[status].label,
  color: RSVP[status].color as PillOption["color"],
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
