import { describe, it, expect } from 'vitest';
import {
  isValidLanguage,
  parseLanguage,
  getLanguageDisplayName,
  getLanguageDirection,
  setLanguageOnDocument,
  getLanguageStorageKey,
  storeLanguage,
  getStoredLanguage,
  initializeLanguage,
  translate,
  createTranslateFn,
  SupportedLanguage,
} from './language.utils';

describe('Language Utilities', () => {
  // We test parseLanguage and related functions in the jsdom environment
  // which doesn't have localStorage, so we test what we can

  describe('isValidLanguage', () => {
    it('should return true for valid English', () => {
      expect(isValidLanguage('en')).toBe(true);
    });

    it('should return true for valid Telugu', () => {
      expect(isValidLanguage('te')).toBe(true);
    });

    it('should return false for invalid language', () => {
      expect(isValidLanguage('fr')).toBe(false);
      expect(isValidLanguage('')).toBe(false);
    });
  });

  describe('parseLanguage', () => {
    it('should return English for valid en', () => {
      expect(parseLanguage('en')).toBe('en');
    });

    it('should return English for null', () => {
      expect(parseLanguage(null)).toBe('en');
    });

    it('should return English for undefined', () => {
      expect(parseLanguage(undefined)).toBe('en');
    });

    it('should return default when given invalid language', () => {
      expect(parseLanguage('fr')).toBe('en');
      expect(parseLanguage('xyz')).toBe('en');
    });

    it('should return specified default when null', () => {
      expect(parseLanguage(null, 'te')).toBe('te');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should return English for en', () => {
      expect(getLanguageDisplayName('en')).toBe('English');
    });

    it('should return Telugu for te', () => {
      expect(getLanguageDisplayName('te')).toBe('తెలుగు');
    });

    it('should return the key itself for unknown language', () => {
      expect(getLanguageDisplayName('xyz')).toBe('xyz');
    });
  });

  describe('getLanguageDirection', () => {
    it('should return ltr for English', () => {
      expect(getLanguageDirection('en')).toBe('ltr');
    });

    it('should return ltr for Telugu', () => {
      expect(getLanguageDirection('te')).toBe('ltr');
    });
  });

  describe('translate', () => {
    it('should translate English key to English', () => {
      expect(translate('dashboard', 'en')).toBe('Dashboard');
    });

    it('should translate English key to Telugu', () => {
      expect(translate('dashboard', 'te')).toBe('డాషబోర్డ్');
    });

    it('should return key if translation not found', () => {
      expect(translate('nonexistent_key', 'en')).toBe('nonexistent_key');
    });

    it('should translate common keys', () => {
      expect(translate('save', 'en')).toBe('Save');
      expect(translate('cancel', 'en')).toBe('Cancel');
      expect(translate('delete', 'en')).toBe('Delete');
    });

    it('should translate Telugu common keys', () => {
      expect(translate('save', 'te')).toBe('సేవ్');
      expect(translate('cancel', 'te')).toBe('వేగు వేసి');
    });
  });

  describe('createTranslateFn', () => {
    it('should create a translate function', () => {
      const translateFn = createTranslateFn('en');
      expect(translateFn('dashboard')).toBe('Dashboard');
      expect(translateFn('save')).toBe('Save');
    });

    it('should translate to Telugu', () => {
      const translateFn = createTranslateFn('te');
      expect(translateFn('dashboard')).toBe('డ آش보니');
    });
  });
});