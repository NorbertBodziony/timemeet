import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../convex/_generated/api";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Screen } from "../components/Screen";
import { SkeletonList } from "../components/Skeleton";
import { SurfaceCard } from "../components/SurfaceCard";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../providers/MockAuthProvider";
import { tap } from "../lib/haptics";
import { useT } from "../providers/LanguageProvider";

export default function Friends() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const friends = useQuery(
    api.friends.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  return (
    <Screen
      title={t("friends.title")}
      subtitle={t("friends.subtitle")}
      dismiss="back"
      right={
        <Pressable onPress={() => router.push("/qr")} hitSlop={10}>
          <Icon name="qr-code-outline" size={24} tint="foreground" />
        </Pressable>
      }
    >
      <Button
        variant="primary"
        size="lg"
        className="mb-4"
        onPress={() => {
          tap();
          router.push("/qr");
        }}
      >
        <Icon name="qr-code" size={18} color="#FFFFFF" />
        <Button.Label>{t("friends.addByQr")}</Button.Label>
      </Button>

      {friends === undefined ? (
        <SkeletonList count={4} />
      ) : friends.length === 0 ? (
        <EmptyState
          icon="qr-code-outline"
          text={t("friends.empty")}
        />
      ) : (
        <View className="gap-2.5">
          {friends.map((f) => (
            <SurfaceCard key={f._id} className="flex-row items-center gap-3">
              <UserAvatar name={f.displayName} photoUrl={f.photoUrl} size="md" />
              <View className="flex-1">
                <Text weight="semibold">{f.displayName}</Text>
                <Text type="body-xs" color="muted">
                  {f.city}
                </Text>
              </View>
            </SurfaceCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
