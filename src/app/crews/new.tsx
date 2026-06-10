import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SurfaceCard } from "../../components/SurfaceCard";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import { impact } from "../../lib/haptics";
import { useT } from "../../providers/LanguageProvider";

export default function NewCrew() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const friends = useQuery(
    api.friends.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const create = useMutation(api.crews.create);

  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    if (!currentUser || !name.trim() || picked.size === 0 || saving) return;
    impact();
    setSaving(true);
    try {
      await create({
        userId: currentUser._id,
        name: name.trim(),
        memberIds: [...picked] as Id<"users">[],
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const ready = !!name.trim() && picked.size > 0;

  return (
    <Screen title={t("crewsNew.title")} subtitle={t("crewsNew.subtitle")} dismiss="close">
      <Input
        value={name}
        onChangeText={setName}
        placeholder={t("crewsNew.namePlaceholder")}
        className="mb-5"
      />
      <SectionHeader tight>{t("crewsNew.members")}</SectionHeader>
      {friends === undefined ? null : friends.length === 0 ? (
        <EmptyState icon="people-outline" text={t("crewsNew.empty")} />
      ) : (
        <View className="gap-2.5">
          {friends.map((f) => {
            const on = picked.has(f._id);
            return (
              <SurfaceCard
                key={f._id}
                onPress={() => toggle(f._id)}
                className="flex-row items-center gap-3"
              >
                <UserAvatar name={f.displayName} photoUrl={f.photoUrl} size="md" />
                <View className="flex-1">
                  <Text weight="semibold">{f.displayName}</Text>
                </View>
                <Icon
                  name={on ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  tint={on ? "accent" : "muted"}
                />
              </SurfaceCard>
            );
          })}
        </View>
      )}
      <Button
        variant="primary"
        size="lg"
        className="mt-7"
        isDisabled={!ready || saving}
        onPress={save}
      >
        <Button.Label>{saving ? t("crewsNew.creating") : t("crewsNew.create")}</Button.Label>
      </Button>
    </Screen>
  );
}
