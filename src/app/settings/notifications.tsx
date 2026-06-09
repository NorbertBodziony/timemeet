import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Screen } from "../../components/Screen";
import { ToggleRow } from "../../components/SettingsRow";
import { useAuth } from "../../providers/MockAuthProvider";

type Prefs = {
  master: boolean;
  newInvite: boolean;
  pollResolved: boolean;
  eventCancelled: boolean;
  reminder2h: boolean;
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const remote = useQuery(
    api.users.notificationPrefs,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const save = useMutation(api.users.setNotificationPrefs);
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    if (remote && !prefs) setPrefs(remote);
  }, [remote, prefs]);

  function set(key: keyof Prefs, value: boolean) {
    if (!prefs || !currentUser) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    save({ userId: currentUser._id, prefs: next });
  }

  if (!prefs) return <Screen title="Notifications">{null}</Screen>;
  const off = !prefs.master;

  return (
    <Screen title="Notifications" subtitle="Only the essentials. We never spam.">
      <ToggleRow label="All notifications" value={prefs.master} onValueChange={(v) => set("master", v)} />
      <Text type="body-xs" weight="semibold" color="muted" className="mt-4 mb-2">
        TRANSACTIONAL
      </Text>
      <ToggleRow label="New invite" value={prefs.newInvite} onValueChange={(v) => set("newInvite", v)} disabled={off} />
      <ToggleRow label="Poll resolved" value={prefs.pollResolved} onValueChange={(v) => set("pollResolved", v)} disabled={off} />
      <ToggleRow label="Event cancelled" value={prefs.eventCancelled} onValueChange={(v) => set("eventCancelled", v)} disabled={off} />
      <ToggleRow label="2 hours before" value={prefs.reminder2h} onValueChange={(v) => set("reminder2h", v)} disabled={off} />
      <Text type="body-xs" color="muted" className="mt-4">
        Quiet hours 22:00–08:00 — coming soon. We won't wake you.
      </Text>
    </Screen>
  );
}
