import * as Haptics from "expo-haptics";

// Light, non-blocking haptics. Failures (e.g. unsupported) are ignored.
export const tap = () =>
  Haptics.selectionAsync().catch(() => {});

export const impact = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export const success = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
