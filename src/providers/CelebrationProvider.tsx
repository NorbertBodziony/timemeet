import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Dimensions, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { Text } from "heroui-native";

// Punctuated joy (docs §2.2): a short confetti + Lutek burst with a success
// haptic at the 3–5 moments where a plan composes. Max ~1.6s, never blocking.

const { width: W, height: H } = Dimensions.get("window");
const COLORS = ["#A3FF12", "#7ED600", "#5DA802", "#F59E0B", "#8B5CF6"];

function Confetti({ runId }: { runId: number }) {
  // 22 pieces, each given a fixed random profile per run.
  const pieces = useRef(
    Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      drift: (Math.random() - 0.5) * 160,
      delay: Math.random() * 150,
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
    }))
  );
  return (
    <>
      {pieces.current.map((p, i) => (
        <Piece key={`${runId}-${i}`} {...p} />
      ))}
    </>
  );
}

function Piece({
  x,
  drift,
  delay,
  size,
  color,
  spin,
}: {
  x: number;
  drift: number;
  delay: number;
  size: number;
  color: string;
  spin: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      t.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
    }, delay);
    return () => clearTimeout(id);
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-30, H * 0.85]) },
      { translateX: interpolate(t.value, [0, 1], [0, drift]) },
      { rotate: `${t.value * spin}deg` },
    ],
    opacity: interpolate(t.value, [0, 0.75, 1], [1, 1, 0]),
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: x, width: size, height: size, borderRadius: 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

type CelebrateApi = { celebrate: (message?: string) => void };
const Ctx = createContext<CelebrateApi | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ runId: number; message?: string } | null>(null);
  const counter = useRef(0);

  const celebrate = useCallback((message?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    counter.current += 1;
    setState({ runId: counter.current, message });
    setTimeout(() => setState(null), 1700);
  }, []);

  return (
    <Ctx.Provider value={{ celebrate }}>
      {children}
      {state && (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Confetti runId={state.runId} />
          <View style={{ position: "absolute", left: 0, right: 0, top: H * 0.34, alignItems: "center" }}>
            <Animated.View
              entering={ZoomIn.duration(200)}
              exiting={ZoomOut}
              className="items-center rounded-3xl bg-surface border border-border px-6 py-5"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 44 }}>🦦</Text>
              {!!state.message && (
                <Text weight="bold" align="center" className="mt-1 max-w-[220px]">
                  {state.message}
                </Text>
              )}
            </Animated.View>
          </View>
        </View>
      )}
    </Ctx.Provider>
  );
}

export function useCelebrate(): CelebrateApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCelebrate must be used inside CelebrationProvider");
  return ctx;
}
