/**
 * Translation Service
 * Handles dynamic translation of organism descriptions using Google Translate API
 */

// Cache for translations to avoid repeated API calls
const translationCache = {};

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { label: 'English', flag: '🇺🇸', nativeName: 'English' },
  hi: { label: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  mr: { label: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' }
};

/**
 * Translate text using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (hi, mr, en)
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang = 'en') => {
  // If target language is English, return original text
  if (targetLang === 'en') {
    return text;
  }

  // Check cache first
  const cacheKey = `${text.substring(0, 50)}_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    // Using Google Translate API via a free endpoint
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      const translatedText = data.responseData.translatedText;
      // Cache the translation
      translationCache[cacheKey] = translatedText;
      return translatedText;
    } else {
      console.warn('Translation API error:', data);
      return text; // Return original text on error
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Translate organism data
 * @param {object} organism - Organism object with properties to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<object>} - Organism with translated fields
 */
export const translateOrganism = async (organism, targetLang = 'en') => {
  if (targetLang === 'en') {
    return organism;
  }

  const translatedOrganism = { ...organism };

  // Fields to translate
  const fieldsToTranslate = [
    'morphology',
    'physiology',
    'description',
    'habitat'
  ];

  try {
    // Translate each field
    for (const field of fieldsToTranslate) {
      if (translatedOrganism[field]) {
        translatedOrganism[field] = await translateText(
          translatedOrganism[field],
          targetLang
        );
      }
    }

    // Translate classification keys and values
    if (translatedOrganism.classification) {
      const translatedClassification = {};
      for (const [key, value] of Object.entries(translatedOrganism.classification)) {
        const translatedKey = await translateText(key, targetLang);
        const translatedValue = await translateText(value, targetLang);
        translatedClassification[translatedKey] = translatedValue;
      }
      translatedOrganism.classification = translatedClassification;
    }

    return translatedOrganism;
  } catch (error) {
    console.error('Error translating organism:', error);
    return organism;
  }
};

/**
 * Get UI text translation (for labels)
 * @param {string} key - Translation key
 * @param {string} lang - Language code
 * @returns {string} - Translated text
 */
export const getUITranslation = (key, lang = 'en') => {
  const uiTranslations = {
    en: {
      translate: 'Translate',
      selectLanguage: 'Select Language',
      morphology: 'Morphology',
      physiology: 'Physiology',
      description: 'Description',
      classification: 'Classification',
      images: 'Images',
      qrCode: 'QR Code',
      kingdom: 'Kingdom',
      phylum: 'Phylum',
      class: 'Class',
      order: 'Order',
      family: 'Family',
      genus: 'Genus',
      species: 'Species'
    },
    hi: {
      translate: 'अनुवाद करें',
      selectLanguage: 'भाषा चुनें',
      morphology: 'आकार विज्ञान',
      physiology: 'शरीर क्रिया विज्ञान',
      description: 'वर्णन',
      classification: 'वर्गीकरण',
      images: 'चित्र',
      qrCode: 'क्यूआर कोड',
      kingdom: 'राज्य',
      phylum: 'संघ',
      class: 'वर्ग',
      order: 'क्रम',
      family: 'परिवार',
      genus: 'वंश',
      species: 'प्रजाति'
    },
    mr: {
      translate: 'अनुवाद करा',
      selectLanguage: 'भाषा निवडा',
      morphology: 'आकार विज्ञान',
      physiology: 'शरीर क्रिया विज्ञान',
      description: 'वर्णन',
      classification: 'वर्गीकरण',
      images: 'चित्रे',
      qrCode: 'क्यूआर कोड',
      kingdom: 'राज्य',
      phylum: 'फायलम',
      class: 'वर्ग',
      order: 'क्रम',
      family: 'कुटुंब',
      genus: 'वंश',
      species: 'प्रजाती'
    }
  };

  return uiTranslations[lang]?.[key] || uiTranslations['en'][key] || key;
};

/**
 * Clear translation cache
 */
export const clearTranslationCache = () => {
  Object.keys(translationCache).forEach(key => delete translationCache[key]);
};

export default {
  SUPPORTED_LANGUAGES,
  translateText,
  translateOrganism,
  getUITranslation,
  clearTranslationCache
};
