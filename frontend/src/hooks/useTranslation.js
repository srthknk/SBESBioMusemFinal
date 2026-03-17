/**
 * Custom Hook for Translation
 * Provides translation functionality for React components
 */

import { useState, useCallback } from 'react';
import { translateText, translateOrganism, SUPPORTED_LANGUAGES } from '../services/translationService';

export const useTranslation = (initialLanguage = 'en') => {
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [translatingText, setTranslatingText] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const changeLanguage = useCallback((lang) => {
    if (SUPPORTED_LANGUAGES[lang]) {
      setCurrentLanguage(lang);
    }
  }, []);

  const translateContent = useCallback(async (text, targetLang) => {
    if (targetLang === 'en' || !text) {
      return text;
    }

    setIsTranslating(true);
    try {
      const translated = await translateText(text, targetLang);
      setIsTranslating(false);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      setIsTranslating(false);
      return text;
    }
  }, []);

  const translateOrganismData = useCallback(async (organism, targetLang) => {
    if (targetLang === 'en' || !organism) {
      return organism;
    }

    setIsTranslating(true);
    try {
      const translated = await translateOrganism(organism, targetLang);
      setIsTranslating(false);
      return translated;
    } catch (error) {
      console.error('Error translating organism:', error);
      setIsTranslating(false);
      return organism;
    }
  }, []);

  return {
    currentLanguage,
    changeLanguage,
    translateContent,
    translateOrganismData,
    isTranslating,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

export default useTranslation;
