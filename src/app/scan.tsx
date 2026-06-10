import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Text } from "heroui-native";
import { IconTile } from "../components/IconTile";
import { Screen } from "../components/Screen";
import { useT } from "../providers/LanguageProvider";
import { impact, tap } from "../lib/haptics";

const FRAME = 280; // QR viewfinder size

// Pull the friend code out of whatever the QR encodes — a deep link
// (.../add/CODE) or a bare code.
function extractCode(data: string): string | null {
  const marker = "/add/";
  const i = data.indexOf(marker);
  const raw = i >= 0 ? data.slice(i + marker.length) : data;
  const code = decodeURIComponent(raw.split(/[?#]/)[0]).trim();
  return code.length ? code : null;
}

export default function Scan() {
  const router = useRouter();
  const { t } = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);
  const [scanned, setScanned] = useState(false);

  function onScan(data: string) {
    if (handled.current) return;
    const code = extractCode(data);
    if (!code) return;
    impact(); // the "got it" moment
    handled.current = true;
    setScanned(true);
    router.replace({ pathname: "/add/[code]", params: { code } });
  }

  // Permission not requested yet.
  if (!permission) return <Screen title={t("scan.title")} dismiss="close">{null}</Screen>;

  if (!permission.granted) {
    return (
      <Screen title={t("scan.title")} subtitle={t("scan.permissionSubtitle")} dismiss="close">
        <View className="flex-1 items-center justify-center gap-4 py-20">
          <IconTile name="camera-outline" size="lg" tone="neutral" />
          <Text color="muted" align="center" className="max-w-[260px] leading-5">
            {t("scan.needCamera")}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={() => {
              tap();
              requestPermission();
            }}
          >
            <Button.Label>{t("scan.allow")}</Button.Label>
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t("scan.title")} subtitle={t("scan.subtitle")} dismiss="close" scroll={false}>
      <View className="flex-1 items-center justify-center">
        <View
          className="overflow-hidden rounded-3xl border border-border"
          style={{ width: FRAME, height: FRAME }}
        >
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : (r) => onScan(r.data)}
          />
        </View>
        <Text color="muted" align="center" className="mt-6">
          {t("scan.lineUp")}
        </Text>
      </View>
    </Screen>
  );
}
