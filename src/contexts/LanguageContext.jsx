import React, { createContext, useContext, useState, useEffect } from 'react';
import vi from '../i18n/vi';
import en from '../i18n/en';

const TRANSLATIONS = { vi, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('edux-lang') || 'vi');

  const t = TRANSLATIONS[lang] || vi;

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi';
      localStorage.setItem('edux-lang', next);
      return next;
    });
  };

  const setLanguage = (l) => {
    localStorage.setItem('edux-lang', l);
    setLang(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
