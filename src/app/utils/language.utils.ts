/**
 * Language Utilities for Finance Audit Pro
 *
 * Supported languages: English (en) and Telugu (te)
 * Default: English
 */

/** Supported languages */
export type SupportedLanguage = 'en' | 'te';

/** Language codes mapped to display names */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  te: 'తెలుగు',
};

/** Language direction (LTR vs RTL) */
export const LANGUAGE_DIRECTION: Record<SupportedLanguage, 'ltr' | 'rtl'> = {
  en: 'ltr',
  te: 'ltr', // Telugu is LTR
};

/**
 * Check if a language code is valid
 *
 * @param lang - Language code to validate
 * @returns true if valid supported language
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return lang === 'en' || lang === 'te';
}

/**
 * Parse and validate language code
 *
 * @param lang - Language code (may be null/undefined)
 * @param defaultLang - Default language if invalid
 * @returns Valid language code
 */
export function parseLanguage(
  lang: string | null | undefined,
  defaultLang: SupportedLanguage = 'en',
): SupportedLanguage {
  if (lang && isValidLanguage(lang)) {
    return lang;
  }
  return defaultLang;
}

/**
 * Get language display name
 *
 * @param lang - Language code
 * @returns Display name for the language, or the key itself if not found
 */
export function getLanguageDisplayName(lang: SupportedLanguage | string): string {
  if (lang === 'en') return 'English';
  if (lang === 'te') return 'తెలుగు';
  return lang; // Return key itself for unknown languages
}

/**
 * Get language direction
 *
 * @param lang - Language code
 * @returns 'ltr' or 'rtl'
 */
export function getLanguageDirection(lang: SupportedLanguage): 'ltr' | 'rtl' {
  return LANGUAGE_DIRECTION[lang];
}

/**
 * Set language on document element
 *
 * Updates the html element's lang attribute and direction
 *
 * @param lang - Language code to set
 */
export function setLanguageOnDocument(lang: SupportedLanguage): void {
  if (typeof document === 'undefined') {
    return;
  }

  const htmlElement = document.documentElement;
  htmlElement.lang = lang;
  htmlElement.dir = getLanguageDirection(lang);
}

/**
 * Create language toggle key for localStorage
 *
 * @param userId - User ID for personalization
 * @returns Storage key
 */
export function getLanguageStorageKey(userId: string): string {
  return `user_language_${userId}`;
}

/**
 * Get stored language preference
 *
 * @param userId - User ID for personalization
 * @returns Stored language or default
 */
export function getStoredLanguage(
  userId: string,
  defaultLang?: SupportedLanguage,
): SupportedLanguage | undefined {
  if (typeof localStorage === 'undefined') {
    return defaultLang;
  }

  try {
    const stored = localStorage.getItem(getLanguageStorageKey(userId));
    if (stored === null) {
      return defaultLang;
    }
    return parseLanguage(stored, defaultLang);
  } catch {
    return defaultLang;
  }
}

/**
 * Store language preference
 *
 * @param userId - User ID for personalization
 * @param lang - Language code to store
 */
export function storeLanguage(userId: string, lang: SupportedLanguage): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(getLanguageStorageKey(userId), lang);
  } catch {
    // Handle storage quota exceeded
  }
}

/**
 * Initialize language from storage or browser preference
 *
 * @param userId - User ID for personalization
 * @param fallbackLang - Fallback language
 * @returns Initialized language
 */
export function initializeLanguage(
  userId: string,
  fallbackLang: SupportedLanguage = 'en',
): SupportedLanguage {
  // Check stored preference first (may return undefined if not set)
  const stored = getStoredLanguage(userId);
  if (stored !== undefined) {
    setLanguageOnDocument(stored);
    return stored;
  }

  // Check browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0];
    if (isValidLanguage(browserLang)) {
      setLanguageOnDocument(browserLang);
      return browserLang;
    }
  }

  // Set default
  setLanguageOnDocument(fallbackLang);
  return fallbackLang;
}

/**
 * Translation key type
 */
export type TranslationKey = string;

/**
 * Translation record type
 */
export interface TranslationRecord {
  [key: string]: string;
}

/**
 * Translations for supported languages
 */
export const TRANSLATIONS: Record<SupportedLanguage, TranslationRecord> = {
  en: {
    // Common UI
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    // Dashboard
    dashboard: 'Dashboard',
    customers: 'Customers',
    collections: 'Collections',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',

    // Customer management
    customer_name: 'Customer Name',
    customer_phone: 'Phone Number',
    customer_email: 'Email',
    customer_address: 'Address',
    enrollment_date: 'Enrollment Date',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',

    // Payments
    payment_amount: 'Payment Amount',
    payment_method: 'Payment Method',
    cash: 'Cash',
    online: 'Online',
    cheque: 'Cheque',
    other: 'Other',
    payment_date: 'Payment Date',
    reference: 'Reference',
    notes: 'Notes',

    // Weekly schedules
    weekly_due: 'Weekly Due',
    outstanding_balance: 'Outstanding Balance',
    next_due_date: 'Next Due Date',
    payment_history: 'Payment History',
    ledger: 'Ledger',

    // Absences
    absence: 'Absence',
    reason: 'Reason',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    request_absence: 'Request Absence',

    // Financial
    total_due: 'Total Due',
    total_paid: 'Total Paid',
    credit: 'Credit',
    inr_currency: '₹',
  },

  te: {
    // Common UI
    save: 'సేవ్',
    cancel: 'వేగు వేసి',
    delete: 'తీసివేయండి',
    edit: 'సవరించండి',
    add: 'జోడించండి',
    confirm: 'నిశ్చయించండి',
    yes: 'అవును',
    no: 'కాదు',

    // Dashboard
    dashboard: 'డాషబోర్డ్',
    customers: 'కస్టమర్లు',
    collections: 'సేకరణలు',
    reports: 'రిపోర్ట్లు',
    settings: 'సెట్టింగ్స్',
    logout: 'లాగ్ ఐడ్',

    // Customer management
    customer_name: 'కస్టమర్ పేరు',
    customer_phone: 'ఫోన్ నంబర్',
    customer_email: 'ఇమెయిల్',
    customer_address: 'చిరుగామి',
    enrollment_date: 'నరంజీ తేది',
    status: 'స్థితి',
    active: 'కక్షకరిద్దాయి',
    inactive: 'కక్షకరిద్దలేదు',
    suspended: 'నిలిపివేయబడ్డది',

    // Payments
    payment_amount: 'పేమెంట్ పరిమాణం',
    payment_method: 'పేమెంట్ పద్ధతి',
    cash: 'నాణ్యం',
    online: 'ఆన్‌లైన్',
    cheque: 'చెక్',
    other: 'ఇతరాలు',
    payment_date: 'పేమెంట్ తేది',
    reference: 'సందర్భం',
    notes: 'గురించి',

    // Weekly schedules
    weekly_due: 'పర్యాయ పేమెంట్',
    outstanding_balance: 'ఉపలబ్ధ యోగ్యత',
    next_due_date: 'తరుహ తేది',
    payment_history: 'పేమెంట్ చరిత్ర',
    ledger: 'లెడ్జర్',

    // Absences
    absence: 'లేకపడటం',
    reason: 'కారణం',
    approved: 'అనుమోదించబడింది',
    rejected: 'నిరాకరించబడింది',
    pending: 'పంచేగా',
    request_absence: 'లేకపడటం అభ్యర్థన',

    // Financial
    total_due: 'మొత్తం యోగ్యత',
    total_paid: 'మొత్తం పతరం',
    credit: 'క్రెడిట్',
    inr_currency: '₹',
  },
};

/**
 * Translate a key to the given language
 *
 * @param key - Translation key
 * @param lang - Language code
 * @returns Translated string or key if not found
 */
export function translate(key: TranslationKey, lang: SupportedLanguage): string {
  const translations = TRANSLATIONS[lang];
  return translations?.[key] ?? key;
}

/**
 * Create a translation function for a given language
 *
 * @param lang - Language code
 * @returns Function that translates keys to the given language
 */
export function createTranslateFn(
  lang: SupportedLanguage,
): (key: TranslationKey) => string {
  return (key: TranslationKey) => translate(key, lang);
}