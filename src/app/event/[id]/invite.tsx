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

const STATE_LABEL: Record<string, string> = {
  going: "Going",
  maybe: "Maybe",
  invited: "Invited",
};

export default function InviteFriends() {
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
    if (ok) push.push({ title: `Invited ${name.split(" ")[0]} ✨` });
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
        title: invited > 0 ? `Invited ${name} ✨` : `${name} are all already in`,
      });
    }
  }

  return (
    <Screen title="Invite friends" subtitle="Tap to add them to this meetup." dismiss="close">
      {/* Invite a whole crew at once. */}
      {!!crews && crews.length > 0 && (
        <View className="mb-2">
          <SectionHeader tight>Crews</SectionHeader>
          <View className="gap-2.5">
            {crews.map((c) => (
              <SurfaceCard key={c._id} className="flex-row items-center gap-3">
                <Icon name="people" size={20} tint="accent" />
                <View className="flex-1">
                  <Text weight="semibold">{c.name}</Text>
                  <Text type="body-xs" color="muted">
                    {c.members.length} people
                  </Text>
                </View>
                <Button variant="primary" size="sm" onPress={() => onInviteCrew(c._id, c.name)}>
                  <Button.Label>Invite all</Button.Label>
                </Button>
              </SurfaceCard>
            ))}
          </View>
        </View>
      )}

      {!!crews && crews.length > 0 && <SectionHeader>Friends</SectionHeader>}
      {friends === undefined ? null : friends.length === 0 ? (
        <EmptyState
          icon="people-outline"
          text="No friends yet — add some to invite them along."
        />
      ) : (
        <View className="gap-2.5">
          {friends.map(({ friend, state }) => (
            <SurfaceCard key={friend._id} className="flex-row items-center gap-3">
              <UserAvatar name={friend.displayName} size="md" />
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
                  <Button.Label>Invite</Button.Label>
                </Button>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Icon name="checkmark-circle" size={16} tint="success" />
                  <Text type="body-sm" color="muted">
                    {STATE_LABEL[state]}
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
