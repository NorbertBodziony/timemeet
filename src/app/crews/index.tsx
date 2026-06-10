import { useRouter } from "expo-router";
import { View } from "react-native";
import { useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import { tap } from "../../lib/haptics";

export default function Crews() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const crews = useQuery(
    api.crews.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  return (
    <Screen
      title="Crews"
      subtitle="Groups you can invite in one tap."
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
          <Button.Label>New</Button.Label>
        </Button>
      }
    >
      {crews === undefined ? null : crews.length === 0 ? (
        <EmptyState
          icon="people-outline"
          text="No crews yet — make one to invite a whole group at once."
        />
      ) : (
        <View className="gap-2.5">
          {crews.map((c) => (
            <SurfaceCard key={c._id} className="gap-2.5 py-3.5">
              <View className="flex-row items-center justify-between">
                <Text weight="semibold">{c.name}</Text>
                <Text type="body-xs" color="muted">
                  {c.members.length} {c.members.length === 1 ? "person" : "people"}
                </Text>
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
