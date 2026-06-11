import { useRouter } from "expo-router";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Text, useThemeColor } from "heroui-native";
import { Icon } from "../components/Icon";
import { Screen } from "../components/Screen";
import { UserAvatar } from "../components/UserAvatar";
import { cardShadowLifted } from "../lib/ui";
import { useAuth } from "../providers/MockAuthProvider";
import { tap } from "../lib/haptics";
import { webLink } from "../lib/links";
import { useT } from "../providers/LanguageProvider";

export default function MyQrCode() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const foreground = useThemeColor("foreground");
  const accent = useThemeColor("accent");

  if (!currentUser) return <Screen title={t("qr.title")} dismiss="close">{null}</Screen>;

  // Universal link — the in-app scanner reads the trailing code; a phone
  // camera opens the app (or the web fallback for people without it).
  const payload = webLink(`/add/${currentUser.referralCode}`);

  return (
    <Screen title={t("qr.title")} subtitle={t("qr.subtitle")} dismiss="close">
      <View className="items-center mt-4">
        <View
          className="bg-surface rounded-3xl p-6 items-center"
          style={cardShadowLifted}
        >
          <QRCode
            value={payload}
            size={232}
            color={foreground}
            backgroundColor="transparent"
            logoBackgroundColor="transparent"
          />
        </View>

        <View className="items-center mt-6 gap-1">
          <UserAvatar name={currentUser.displayName} size="lg" />
          <Text type="h3" weight="bold" className="mt-2">
            {currentUser.displayName}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="pricetag-outline" size={13} tint="muted" />
            <Text type="body-xs" color="muted">
              {currentUser.referralCode}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-10">
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            tap();
            router.push("/scan");
          }}
        >
          <Icon name="scan" size={18} color="#FFFFFF" />
          <Button.Label>{t("qr.scan")}</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
