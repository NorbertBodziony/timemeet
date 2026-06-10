import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DEFAULT_LANG, setCurrentLang, translate, type Lang } from "../lib/i18n";
import { useAuth } from "./MockAuthProvider";

const STORE_KEY = "mt_lang";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (k) => k,
});

// Language state: Polish by default, persisted on device, synced to the user
// doc so the backend can render notifications in the right language.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const { currentUser } = useAuth();
  const setLanguage = useMutation(api.users.setLanguage);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((stored) => {
      if (stored === "pl" || stored === "en") {
        setLangState(stored);
        setCurrentLang(stored);
      }
    });
  }, []);

  // Keep the backend in sync (notifications speak the user's language).
  useEffect(() => {
    if (currentUser && currentUser.language !== lang) {
      setLanguage({ userId: currentUser._id, language: lang }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id, lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setCurrentLang(next);
    AsyncStorage.setItem(STORE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT(): Ctx {
  return useContext(LanguageContext);
}
