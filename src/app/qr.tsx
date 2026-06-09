import { useRouter } from "expo-router";
import { View } from "react-native";
import * as Linking from "expo-linking";
import QRCode from "react-native-qrcode-svg";
import { Button, Text, useThemeColor } from "heroui-native";
import { Icon } from "../components/Icon";
import { Screen } from "../components/Screen";
import { UserAvatar } from "../components/UserAvatar";
import { cardShadowLifted } from "../lib/ui";
import { useAuth } from "../providers/MockAuthProvider";

export default function MyQrCode() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const foreground = useThemeColor("foreground");
  const accent = useThemeColor("accent");

  if (!currentUser) return <Screen title="Your code" dismiss="close">{null}</Screen>;

  // Encode a runtime-correct deep link (exp:// in Expo Go, the app scheme in a
  // build). The scanner also just reads the trailing code, so either works.
  const payload = Linking.createURL(`/add/${currentUser.referralCode}`);

  return (
    <Screen title="Your QR code" subtitle="Let a friend scan this to add you." dismiss="close">
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
        <Button variant="primary" size="lg" onPress={() => router.push("/scan")}>
          <Icon name="scan" size={18} color="#FFFFFF" />
          <Button.Label>Scan a friend's code</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
