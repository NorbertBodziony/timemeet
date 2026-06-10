import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { ListGroup, Separator, Switch, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { useAuth } from "../../providers/MockAuthProvider";
import { tap } from "../../lib/haptics";
import type { IconName } from "../../lib/icons";
import { useT } from "../../providers/LanguageProvider";

type Prefs = {
  master: boolean;
  newInvite: boolean;
  pollResolved: boolean;
  eventCancelled: boolean;
  reminder2h: boolean;
  activity?: boolean;
  quietHours?: boolean;
};

const TRANSACTIONAL: { key: keyof Prefs; labelKey: string; icon: IconName }[] = [
  { key: "newInvite", labelKey: "notifSet.newInvite", icon: "mail-outline" },
  { key: "pollResolved", labelKey: "notifSet.pollResolved", icon: "checkmark-done-outline" },
  { key: "eventCancelled", labelKey: "notifSet.eventCancelled", icon: "close-circle-outline" },
  { key: "reminder2h", labelKey: "notifSet.twoHours", icon: "alarm-outline" },
  { key: "activity", labelKey: "notifSet.activity", icon: "people-outline" },
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
        <Switch
          isSelected={value}
          onSelectedChange={(v) => {
            tap();
            onChange(v);
          }}
          isDisabled={disabled}
        />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

export default function Notifications() {
  const { t } = useT();
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

  if (!prefs) return <Screen title={t("notifSet.title")} dismiss="back">{null}</Screen>;
  const off = !prefs.master;

  return (
    <Screen title={t("notifSet.title")} subtitle={t("notifSet.subtitle")} dismiss="back">
      <ListGroup>
        <Row
          label={t("notifSet.all")}
          icon="notifications-outline"
          value={prefs.master}
          onChange={(v) => set("master", v)}
        />
      </ListGroup>

      <SectionHeader>{t("notifSet.transactional")}</SectionHeader>
      <ListGroup>
        {TRANSACTIONAL.map((row, i) => (
          <View key={row.key}>
            {i > 0 && <Separator className="ml-14" />}
            <Row
              label={t(row.labelKey)}
              icon={row.icon}
              value={prefs[row.key] ?? true}
              disabled={off}
              onChange={(v) => set(row.key, v)}
            />
          </View>
        ))}
      </ListGroup>

      <SectionHeader>{t("notifSet.quietSection")}</SectionHeader>
      <ListGroup>
        <Row
          label={t("notifSet.quiet")}
          icon="moon-outline"
          value={prefs.quietHours ?? true}
          disabled={off}
          onChange={(v) => set("quietHours", v)}
        />
      </ListGroup>
      <Text type="body-xs" color="muted" className="mt-2 ml-1">
        {t("notifSet.quietHint")}
      </Text>
    </Screen>
  );
}
