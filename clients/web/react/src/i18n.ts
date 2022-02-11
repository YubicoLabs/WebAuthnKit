import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

function initI18n(loadPath: string, defaultLanguage: string) {
  return i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(HttpApi)
    .init({
      backend: { loadPath },
      fallbackLng: defaultLanguage,
      load: "currentOnly",
      debug: process.env.NODE_ENV === "development",
    });
}

function getCurrentLanguage(): string {
  return i18n.language;
}

function changeLanguage(language: string) {
  return i18n.changeLanguage(language);
}

function onLanguageChanged(callback: (language: string) => void) {
  return i18n.on("languageChanged", callback);
}

export { initI18n, getCurrentLanguage, changeLanguage, onLanguageChanged };
