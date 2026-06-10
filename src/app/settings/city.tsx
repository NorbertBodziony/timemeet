import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "convex/react";
import { Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { attempt } from "../../lib/attempt";
import { searchCities } from "../../lib/cities";
import { tap } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

// City picker — curated list + free entry + explicit "leave empty".
export default function CityPicker() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const update = useMutation(api.users.update);

  const [query, setQuery] = useState("");
  const results = searchCities(query);
  const trimmed = query.trim();
  const isCustom =
    trimmed.length > 0 && !results.some((c) => c.toLowerCase() === trimmed.toLowerCase());

  async function pick(city: string) {
    if (!currentUser) return;
    tap();
    const ok = await attempt(() =>
      update({ userId: currentUser._id, patch: { city } })
    );
    if (ok) router.back();
  }

  return (
    <Screen title={t("city.title")} subtitle={t("city.subtitle")} dismiss="back">
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t("city.searchPlaceholder")}
        autoFocus
      />

      <View className="gap-2.5 mt-4">
        {/* Free entry — what testers type wins over the list. */}
        {isCustom && (
          <SurfaceCard className="flex-row items-center gap-3" onPress={() => pick(trimmed)}>
            <Icon name="add-circle-outline" size={20} tint="accent" />
            <Text weight="semibold" className="flex-1">
              {t("city.useCustom", { name: trimmed })}
            </Text>
          </SurfaceCard>
        )}

        {results.map((c) => {
          const on = currentUser?.city === c;
          return (
            <SurfaceCard key={c} className="flex-row items-center gap-3" onPress={() => pick(c)}>
              <Icon name="location-outline" size={20} tint="muted" />
              <Text weight="semibold" className="flex-1">
                {c}
              </Text>
              {on && <Icon name="checkmark-circle" size={22} tint="accent" />}
            </SurfaceCard>
          );
        })}

        <SurfaceCard className="flex-row items-center gap-3" onPress={() => pick("")}>
          <Icon name="close-circle-outline" size={20} tint="muted" />
          <Text color="muted" className="flex-1">
            {t("city.leaveEmpty")}
          </Text>
          {!currentUser?.city && <Icon name="checkmark-circle" size={22} tint="accent" />}
        </SurfaceCard>
      </View>
    </Screen>
  );
}
