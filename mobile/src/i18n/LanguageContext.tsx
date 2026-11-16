import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatTranslations } from "./chatTranslations";
import { profileTranslations } from "./profileTranslations";
import { secondaryTranslations } from "./secondaryTranslations";
import { weatherTranslations } from "./weatherTranslations";
import { commonTranslations } from "./commonTranslations";

export type Language = "pt-BR" | "en";

const translations = {
  ...chatTranslations,
  ...profileTranslations,
  ...secondaryTranslations,
  ...weatherTranslations,
  ...commonTranslations,
};
const portuguese = Object.fromEntries(
  Object.entries(translations).map(([pt, en]) => [en, pt]),
);

export function translate(text: string, language: Language): string {
  return language === "en"
    ? (translations[text] ?? text)
    : (portuguese[text] ?? text);
}

const LanguageContext = createContext<{
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<Language>("pt-BR");
  const changed = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem("cin.language")
      .then((value) => {
        if (active && !changed.current && (value === "pt-BR" || value === "en"))
          updateLanguage(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((value: Language) => {
    changed.current = true;
    updateLanguage(value);
    void AsyncStorage.setItem("cin.language", value).catch(() => {});
  }, []);
  const t = useCallback(
    (text: string) => translate(text, language),
    [language],
  );
  const value = useMemo(
    () => ({
      language,
      locale: language === "en" ? "en-US" : "pt-BR",
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider is required");
  return value;
}
