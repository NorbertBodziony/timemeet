import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { ListGroup, Separator, Switch, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";
import type { IconName } from "../../lib/icons";

type Prefs = {
  master: boolean;
  newInvite: boolean;
  pollResolved: boolean;
  eventCancelled: boolean;
  reminder2h: boolean;
};

const TRANSACTIONAL: { key: keyof Prefs; label: string; icon: IconName }[] = [
  { key: "newInvite", label: "New invite", icon: "mail-outline" },
  { key: "pollResolved", label: "Poll resolved", icon: "checkmark-done-outline" },
  { key: "eventCancelled", label: "Event cancelled", icon: "close-circle-outline" },
  { key: "reminder2h", label: "2 hours before", icon: "alarm-outline" },
];

function Row({
  label,
  icon,
  value,
  disabled,
  onChange,
}: {
  label: string;
  icon: IconName;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <ListGroup.Item style={{ opacity: disabled ? 0.45 : 1 }}>
      <ListGroup.ItemPrefix>
        <Icon name={icon} size={20} tint="accent" />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={value} onSelectedChange={onChange} isDisabled={disabled} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

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
      <ListGroup>
        <Row
          label="All notifications"
          icon="notifications-outline"
          value={prefs.master}
          onChange={(v) => set("master", v)}
        />
      </ListGroup>

      <Text type="body-xs" weight="semibold" color="muted" className="mt-6 mb-2 ml-1">
        TRANSACTIONAL
      </Text>
      <ListGroup>
        {TRANSACTIONAL.map((t, i) => (
          <View key={t.key}>
            {i > 0 && <Separator className="ml-14" />}
            <Row
              label={t.label}
              icon={t.icon}
              value={prefs[t.key]}
              disabled={off}
              onChange={(v) => set(t.key, v)}
            />
          </View>
        ))}
      </ListGroup>

      <Text type="body-xs" color="muted" className="mt-4 ml-1">
        Quiet hours 22:00–08:00 — coming soon. We won't wake you.
      </Text>
    </Screen>
  );
}
