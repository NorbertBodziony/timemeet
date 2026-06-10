import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "../../../components/EmptyState";
import { Icon } from "../../../components/Icon";
import { Screen } from "../../../components/Screen";
import { SectionHeader } from "../../../components/SectionHeader";
import { SurfaceCard } from "../../../components/SurfaceCard";
import { UserAvatar } from "../../../components/UserAvatar";
import { useAuth } from "../../../providers/MockAuthProvider";
import { attempt } from "../../../lib/attempt";
import { tap } from "../../../lib/haptics";
import { usePush } from "../../../providers/MockPushProvider";
import { tn } from "../../../lib/i18n";
import { useT } from "../../../providers/LanguageProvider";

const STATE_KEY: Record<string, string> = {
  going: "inviteSheet.statusGoing",
  maybe: "inviteSheet.statusMaybe",
  invited: "inviteSheet.statusInvited",
};

export default function InviteFriends() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;
  const { currentUser } = useAuth();
  const push = usePush();

  const friends = useQuery(
    api.friends.listForInvite,
    currentUser ? { userId: currentUser._id, eventId } : "skip"
  );
  const crews = useQuery(
    api.crews.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const invite = useMutation(api.friends.inviteFriend);
  const inviteCrew = useMutation(api.crews.inviteToEvent);

  async function onInvite(friendId: Id<"users">, name: string) {
    if (!currentUser) return;
    tap();
    const ok = await attempt(() => invite({ userId: currentUser._id, eventId, friendId }));
    if (ok) push.push({ title: t("inviteSheet.invited", { name: name.split(" ")[0] }) });
  }

  async function onInviteCrew(crewId: Id<"crews">, name: string) {
    if (!currentUser) return;
    tap();
    let invited = 0;
    const ok = await attempt(async () => {
      ({ invited } = await inviteCrew({ userId: currentUser._id, eventId, crewId }));
    });
    if (ok) {
      push.push({
        title: invited > 0 ? t("inviteSheet.invitedCrew", { name }) : t("inviteSheet.allIn", { name }),
      });
    }
  }

  return (
    <Screen title={t("inviteSheet.title")} subtitle={t("inviteSheet.subtitle")} dismiss="close">
      {/* Invite a whole crew at once. */}
      {!!crews && crews.length > 0 && (
        <View className="mb-2">
          <SectionHeader tight>{t("inviteSheet.crews")}</SectionHeader>
          <View className="gap-2.5">
            {crews.map((c) => (
              <SurfaceCard key={c._id} className="flex-row items-center gap-3">
                <Icon name="people" size={20} tint="accent" />
                <View className="flex-1">
                  <Text weight="semibold">{c.name}</Text>
                  <Text type="body-xs" color="muted">
                    {tn("common.peopleCount", c.members.length)}
                  </Text>
                </View>
                <Button variant="primary" size="sm" onPress={() => onInviteCrew(c._id, c.name)}>
                  <Button.Label>{t("inviteSheet.inviteAll")}</Button.Label>
                </Button>
              </SurfaceCard>
            ))}
          </View>
        </View>
      )}

      {!!crews && crews.length > 0 && <SectionHeader>{t("inviteSheet.friends")}</SectionHeader>}
      {friends === undefined ? null : friends.length === 0 ? (
        <EmptyState
          icon="people-outline"
          text={t("inviteSheet.empty")}
        />
      ) : (
        <View className="gap-2.5">
          {friends.map(({ friend, state }) => (
            <SurfaceCard key={friend._id} className="flex-row items-center gap-3">
              <UserAvatar name={friend.displayName} photoUrl={friend.photoUrl} size="md" />
              <View className="flex-1">
                <Text weight="semibold">{friend.displayName}</Text>
                <Text type="body-xs" color="muted">
                  {friend.city}
                </Text>
              </View>
              {state === "none" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => onInvite(friend._id, friend.displayName)}
                >
                  <Icon name="add" size={16} color="#FFFFFF" />
                  <Button.Label>{t("inviteSheet.invite")}</Button.Label>
                </Button>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Icon name="checkmark-circle" size={16} tint="success" />
                  <Text type="body-sm" color="muted">
                    {t(STATE_KEY[state])}
                  </Text>
                </View>
              )}
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
