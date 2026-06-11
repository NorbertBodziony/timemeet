import { useRouter } from "expo-router";
import { Alert, Pressable, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SkeletonList } from "../../components/Skeleton";
import { SurfaceCard } from "../../components/SurfaceCard";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import { attempt } from "../../lib/attempt";
import { tap } from "../../lib/haptics";
import { tn } from "../../lib/i18n";
import { useT } from "../../providers/LanguageProvider";

export default function Crews() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const crews = useQuery(
    api.crews.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const removeCrew = useMutation(api.crews.remove);

  function confirmDelete(crewId: Id<"crews">, name: string) {
    if (!currentUser) return;
    tap();
    Alert.alert(t("crews.deleteTitle", { name }), t("crews.deleteBody"), [
      { text: t("crews.deleteCancel"), style: "cancel" },
      {
        text: t("crews.deleteConfirm"),
        style: "destructive",
        onPress: () => void attempt(() => removeCrew({ userId: currentUser._id, crewId })),
      },
    ]);
  }

  return (
    <Screen
      title={t("crews.title")}
      subtitle={t("crews.subtitle")}
      dismiss="back"
      right={
        <Button
          variant="primary"
          size="sm"
          onPress={() => {
            tap();
            router.push("/crews/new" as never);
          }}
        >
          <Icon name="add" size={16} color="#FFFFFF" />
          <Button.Label>{t("crews.new")}</Button.Label>
        </Button>
      }
    >
      {crews === undefined ? (
        <SkeletonList count={3} />
      ) : crews.length === 0 ? (
        <EmptyState
          icon="people-outline"
          text={t("crews.empty")}
        />
      ) : (
        <View className="gap-2.5">
          {crews.map((c) => (
            <SurfaceCard key={c._id} className="gap-2.5 py-3.5">
              <View className="flex-row items-center justify-between">
                <Text weight="semibold" className="flex-1">
                  {c.name}
                </Text>
                <Text type="body-xs" color="muted">
                  {tn("common.peopleCount", c.members.length)}
                </Text>
                {c.createdBy === currentUser?._id && (
                  <Pressable hitSlop={8} onPress={() => confirmDelete(c._id, c.name)}>
                    <Icon name="trash-outline" size={16} tint="muted" />
                  </Pressable>
                )}
              </View>
              <View className="flex-row flex-wrap gap-2">
                {c.members.map((m) => (
                  <View key={m._id} className="flex-row items-center gap-1.5">
                    <UserAvatar name={m.displayName} photoUrl={m.photoUrl} size="sm" />
                    <Text type="body-xs" color="muted">
                      {m.displayName.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
