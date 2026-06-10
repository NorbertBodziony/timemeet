import { StatusPills, type PillOption } from "./StatusPills";
import { useT } from "../providers/LanguageProvider";
import { RSVP, RSVP_ACTIONS, RSVP_COLORS, type RsvpStatus } from "../lib/theme";

// The 5-status RSVP control (docs §3.3, brand sheet §03): a 2×2 set of status
// pills in the dedicated RSVP palette. Copy stays non-punishing.
export function RsvpPicker({
  value,
  onChange,
}: {
  value: RsvpStatus | null;
  onChange: (status: RsvpStatus) => void;
}) {
  const { t } = useT();
  const options: PillOption[] = RSVP_ACTIONS.map((status) => ({
    value: status,
    label: t(RSVP[status].labelKey),
    fill: RSVP_COLORS[status].fill,
    icon: RSVP[status].ion,
  }));
  return (
    <StatusPills
      options={options}
      value={value}
      onChange={(v) => onChange(v as RsvpStatus)}
      columns={2}
    />
  );
}
