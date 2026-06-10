import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Spinner, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "../../../components/EmptyState";
import { Icon } from "../../../components/Icon";
import { Screen } from "../../../components/Screen";
import { SurfaceCard } from "../../../components/SurfaceCard";
import { UserAvatar } from "../../../components/UserAvatar";
import { attempt } from "../../../lib/attempt";
import { tap } from "../../../lib/haptics";
import { pickImages, uploadImage } from "../../../lib/photos";
import { useAuth } from "../../../providers/MockAuthProvider";
import { useT } from "../../../providers/LanguageProvider";

// The event board, on its own page — intentional messages, not a chat stream.
export default function Board() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;
  const { currentUser } = useAuth();

  const data = useQuery(
    api.events.get,
    currentUser ? { eventId, userId: currentUser._id } : { eventId }
  );
  const posts = useQuery(api.posts.listForEvent, { eventId });
  const addPost = useMutation(api.posts.add);
  const uploadUrl = useMutation(api.posts.generateUploadUrl);

  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  const isOrganizer = currentUser?._id === data?.event.creatorId;

  async function post() {
    if (!currentUser || !draft.trim()) return;
    tap();
    const ok = await attempt(() =>
      addPost({
        userId: currentUser._id,
        eventId,
        body: draft.trim(),
        isAnnouncement: !!isOrganizer,
      })
    );
    if (ok) setDraft("");
  }

  async function addPhoto() {
    if (!currentUser || uploading) return;
    tap();
    const uris = await pickImages({ multiple: true });
    if (uris.length === 0) return;
    setUploading(true);
    try {
      await attempt(async () => {
        const imageIds: string[] = [];
        for (const uri of uris) {
          const url = await uploadUrl({ userId: currentUser._id });
          imageIds.push(await uploadImage(uri, url));
        }
        await addPost({
          userId: currentUser._id,
          eventId,
          body: draft.trim(),
          isAnnouncement: false,
          imageIds: imageIds as never,
        });
        setDraft("");
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen title={t("event.board")} subtitle={data?.event.title} dismiss="back">
      <View className="flex-row gap-2 mb-4 items-center">
        <View className="flex-1">
          <Input value={draft} onChangeText={setDraft} placeholder={t("event.boardPlaceholder")} />
        </View>
        <Button variant="outline" size="md" isIconOnly onPress={addPhoto} isDisabled={uploading}>
          {uploading ? <Spinner size="sm" /> : <Icon name="image-outline" size={18} tint="foreground" />}
        </Button>
        <Button variant="primary" size="md" isIconOnly onPress={post}>
          <Icon name="arrow-up" size={18} color="#FFFFFF" />
        </Button>
      </View>

      {posts !== undefined && posts.length === 0 ? (
        <EmptyState icon="chatbubble-outline" text={t("event.boardEmptyHint")} />
      ) : (
        (posts ?? []).map((p) => (
          <SurfaceCard key={p._id} className="mb-2.5">
            <View className="flex-row gap-2.5">
              <UserAvatar name={p.author?.displayName} photoUrl={p.author?.photoUrl} size="sm" />
              <View className="flex-1">
                <Text type="body-xs" weight="semibold" color="muted">
                  {p.author?.displayName ?? "—"}
                  {p.isAnnouncement ? t("event.announcement") : ""}
                </Text>
                {!!p.body && <Text type="body-sm">{p.body}</Text>}
                {p.imageUrls.length === 1 && (
                  <Image
                    source={{ uri: p.imageUrls[0] }}
                    className="mt-2 rounded-xl w-full"
                    style={{ aspectRatio: 4 / 3 }}
                    resizeMode="cover"
                  />
                )}
                {p.imageUrls.length > 1 && (
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    {p.imageUrls.map((u) => (
                      <Image
                        key={u}
                        source={{ uri: u }}
                        className="rounded-xl"
                        style={{ width: "48.5%", aspectRatio: 1 }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </SurfaceCard>
        ))
      )}
    </Screen>
  );
}
