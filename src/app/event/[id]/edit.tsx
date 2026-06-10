import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Card, Input, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { FormLabel } from "../../../components/FormLabel";
import { Icon } from "../../../components/Icon";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { Screen } from "../../../components/Screen";
import { SectionHeader } from "../../../components/SectionHeader";
import { formatDateTime } from "../../../lib/datetime";
import { tap, warn } from "../../../lib/haptics";
import { useAuth } from "../../../providers/MockAuthProvider";
import { usePush } from "../../../providers/MockPushProvider";
import { errorMessage } from "../../../lib/attempt";
import { useT } from "../../../providers/LanguageProvider";

const DAY_MS = 24 * 60 * 60 * 1000;

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(18, 0, 0, 0);
    return day.getTime();
  });
}

export default function EditEvent() {
  const router = useRouter();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;
  const { currentUser } = useAuth();
  const push = usePush();

  const data = useQuery(api.events.get, { eventId });
  const edit = useMutation(api.events.edit);
  const slots = useMemo(() => candidateSlots(Date.now()), []);

  const [title, setTitle] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (data === undefined) return <Screen title={t("common.loading")} dismiss="close">{null}</Screen>;
  if (data === null)
    return <Screen title={t("common.eventNotFound")} dismiss="close">{null}</Screen>;
  const { event } = data;

  const curTitle = title ?? event.title;
  const curAddress = address ?? event.customAddress ?? "";
  const curDesc = description ?? event.description ?? "";
  const curStart = startsAt ?? event.startsAt;

  const changes: { label: string; from: string; to: string }[] = [];
  if (curTitle !== event.title) changes.push({ label: t("eventForm.fieldTitle"), from: event.title, to: curTitle });
  if (curAddress !== (event.customAddress ?? ""))
    changes.push({ label: t("eventForm.where"), from: event.customAddress ?? "—", to: curAddress || "—" });
  if (curDesc !== (event.description ?? ""))
    changes.push({ label: t("eventEdit.notes"), from: event.description ?? "—", to: curDesc || "—" });
  if (curStart !== event.startsAt)
    changes.push({ label: t("eventForm.when"), from: formatDateTime(event.startsAt), to: formatDateTime(curStart) });

  async function save() {
    if (!currentUser || changes.length === 0) return;
    setBusy(true);
    try {
      await edit({
        userId: currentUser._id,
        eventId,
        patch: {
          title: curTitle,
          customAddress: curAddress || undefined,
          description: curDesc || undefined,
          startsAt: curStart,
        },
      });
      push.push({ title: t("eventEdit.updated", { title: curTitle }) });
      router.back();
    } catch (e) {
      warn();
      Alert.alert(t("errors.saveTitle"), errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen title={t("eventEdit.title")} dismiss="close">
      <FormLabel>{t("eventForm.fieldTitle")}</FormLabel>
      <Input value={curTitle} onChangeText={setTitle} maxLength={100} />

      <FormLabel className="mt-5">{t("eventForm.where")}</FormLabel>
      <Input value={curAddress} onChangeText={setAddress} placeholder={t("eventEdit.address")} />

      <FormLabel className="mt-5">{t("eventEdit.notes")}</FormLabel>
      <Input value={curDesc} onChangeText={setDescription} placeholder={t("eventEdit.notesPlaceholder")} multiline />

      <FormLabel className="mt-5">{t("eventForm.when")}</FormLabel>
      <ListGroup>
        {slots.map((s, i) => {
          const on = curStart === s;
          return (
            <View key={s}>
              {i > 0 && <Separator className="ml-4" />}
              <ListGroup.Item
                onPress={() => {
                  tap();
                  setStartsAt(s);
                }}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{formatDateTime(s)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  {on ? (
                    <Icon name="checkmark-circle" size={22} tint="accent" />
                  ) : (
                    <View className="w-[22px]" />
                  )}
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          );
        })}
      </ListGroup>

      {changes.length > 0 && (
        <Card className="mt-5 mb-4">
          <Card.Body>
            <SectionHeader tight>{t("eventEdit.changes")}</SectionHeader>
            {changes.map((c) => (
              <Text key={c.label} type="body-sm" color="muted" className="mb-1">
                {c.label}: {c.from} →{" "}
                <Text type="body-sm" weight="semibold">
                  {c.to}
                </Text>
              </Text>
            ))}
          </Card.Body>
        </Card>
      )}

      <View className="mt-2">
        <PrimaryButton label={t("eventEdit.save")} onPress={save} disabled={changes.length === 0} loading={busy} />
      </View>
    </Screen>
  );
}
