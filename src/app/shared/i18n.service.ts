import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'te';

export interface Translations {
  [key: string]: string;
}

const englishTranslations: Translations = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.customers': 'Customers',
  'nav.collections': 'Collections',
  'nav.ledger': 'Ledger',
  'nav.reports': 'Reports',
  'nav.settings': 'Settings',

  // Dashboard cards
  'dashboard.total_customers': 'Total Customers',
  'dashboard.todays_collection': "Today's Collection",
  'dashboard.weekly_collection': 'Weekly Collection',
  'dashboard.monthly_collection': 'Monthly Collection',
  'dashboard.total_outstanding': 'Total Outstanding',
  'dashboard.pending_payments': 'Pending Payments',

  // Dashboard actions
  'dashboard.quick_actions': 'Quick Actions',
  'dashboard.view_all': 'View All',
  'dashboard.add_customer': 'Add Customer',
  'dashboard.add_collection': 'Add Collection',

  // General
  'loading': 'Loading...',
  'error': 'Error',
  'retry': 'Retry',
  'cancel': 'Cancel',
  'confirm': 'Confirm',
  'save': 'Save',
  'edit': 'Edit',
  'delete': 'Delete',
  'actions': 'Actions',

  // Common UI
  'search': 'Search',
  'filter': 'Filter',
  'sort': 'Sort',
  'refresh': 'Refresh',
  'export': 'Export',
  'import': 'Import',

  // Status
  'status.paid': 'Paid',
  'status.pending': 'Pending',
  'status.overdue': 'Overdue',
  'status.active': 'Active',
  'status.inactive': 'Inactive',

  // Authentication
  'login.title': 'Welcome Back',
  'login.subtitle': 'Sign in to your account',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.forgot_password': 'Forgot password?',
  'login.sign_in': 'Sign In',
  'login.sign_up': 'Sign Up',
  'login.create_account': "Don't have an account? Create one",
  'logout': 'Sign Out',

  // Forms
  'form.customer_name': 'Customer Name',
  'form.phone_number': 'Phone Number',
  'form.email': 'Email',
  'form.address': 'Address',
  'form.amount': 'Amount',
  'form.date': 'Date',
  'form.description': 'Description',
  'form.status': 'Status',
  'form.save': 'Save',
  'form.cancel': 'Cancel',

  // Empty states
  'empty.nodata': 'No data available',
  'empty.nocustomers': 'No customers found',
  'empty.nocollections': 'No collections recorded yet',

  // Theme
  'theme.light': 'Light Mode',
  'theme.dark': 'Dark Mode',

  // Language
  'language.english': 'English',
  'language.telugu': 'తెలుగు',

  // Date formats
  'date.today': 'Today',
  'date.yesterday': 'Yesterday',
  'date.this_week': 'This Week',
  'date.this_month': 'This Month',
  'date.this_year': 'This Year',

  // Dashboard additional
  'dashboard.title': 'Dashboard',
  'dashboard.recent_transactions': 'Recent Transactions',
  'dashboard.date': 'Date',
  'dashboard.customer': 'Customer',
  'dashboard.amount': 'Amount',
  'dashboard.status_label': 'Status',
  'dashboard.no_transactions': 'No transactions recorded yet',
  'dashboard.view_reports': 'View Reports',
};

const teluguTranslations: Translations = {
  // Navigation
  'nav.dashboard': 'డాష్‌బోర్డ్',
  'nav.customers': 'కస్టమర్లు',
  'nav.collections': 'కలెక్షన్లు',
  'nav.ledger': 'లెడ్జర్',
  'nav.reports': 'రిపోర్ట్స్',
  'nav.settings': 'సెట్టింగ్స్',

  // Dashboard cards
  'dashboard.total_customers': 'మొత్త కస్టమర్లు',
  'dashboard.todays_collection': 'ఈరోజి సంచయం',
  'dashboard.weekly_collection': 'వారాధిక సంచయం',
  'dashboard.monthly_collection': 'నెలాధిక సంచయం',
  'dashboard.total_outstanding': 'మొత్త లేక్కలు',
  'dashboard.pending_payments': 'పంక్తి చెల్లింపులు',

  // Dashboard actions
  'dashboard.quick_actions': 'వేగవంత చర్యలు',
  'dashboard.view_all': 'అన్ని వర్క్‌బుక్ చూడండి',
  'dashboard.add_customer': 'కస్టమర్ జోడించండి',
  'dashboard.add_collection': 'సంచయం జోడించండి',

  // General
  'loading': 'లోడ్ అవుత్తోంది...',
  'error': 'తప్పు',
  'retry': 'మళ్లీ ప్రయత్నించండి',
  'cancel': 'రద్దు చేయండి',
  'confirm': 'నిశ్చయించండి',
  'save': 'సేవ్ చేయండి',
  'edit': 'సవరించండి',
  'delete': 'తొలగించండి',
  'actions': 'చర్యలు',

  // Common UI
  'search': 'సర్చ్ చేయండి',
  'filter': 'ఫిల్టర్ చేయండి',
  'sort': 'సార్టు చేయండి',
  'refresh': 'రిఫ్రెష్ చేయండి',
  'export': 'ఎక్స్‌పోర్ట్ చేయండి',
  'import': 'ఇంపోర్ట్ చేయండి',

  // Status
  'status.paid': 'చెల్లించబడింది',
  'status.pending': 'ఖాతేదారు',
  'status.overdue': 'తగ్గిపోయింది',
  'status.active': 'సక్రియ',
  'status.inactive': 'అసక్రియ',

  // Authentication
  'login.title': 'స్వాగతం',
  'login.subtitle': 'మీ ఖాతేదార్లో సైన్ ఇన్ చేయండి',
  'login.email': 'ఇమెయిల్',
  'login.password': 'పాస్‌వర్డ్',
  'login.forgot_password': 'పాస్‌వర్డ్ గుర్తుంచుకోవడం జరిగిందా?',
  'login.sign_in': 'సైన్ ఇన్',
  'login.sign_up': 'సైన్ అప్',
  'login.create_account': 'ఖాతేదారు లేకపోతే, ఒకటి సృష్టించండి',
  'logout': 'లాగ్ అవుట్',

  // Forms
  'form.customer_name': 'కస్టమర్ పేరు',
  'form.phone_number': 'ఫోన్ నంబర్',
  'form.email': 'ఇమెయిల్',
  'form.address': 'చిరునామా',
  'form.amount': 'మొత్తం',
  'form.date': 'తేదీ',
  'form.description': 'వివరణ',
  'form.status': 'స్థితి',
  'form.save': 'సేవ్ చేయండి',
  'form.cancel': 'రద్దు చేయండి',

  // Empty states
  'empty.nodata': 'డేటా అందుబాటులో లేదు',
  'empty.nocustomers': 'కస్టమర్లు కనిపించలేదు',
  'empty.nocollections': 'ఇప్పటికి సంచయాలు నమోదు చేయబడలేదు',

  // Theme
  'theme.light': 'లైట్ మోడ్',
  'theme.dark': 'డార్క్ మోడ్',

  // Language
  'language.english': 'English',
  'language.telugu': 'తెలుగు',

  // Date formats
  'date.today': 'ఈరోజు',
  'date.yesterday': 'వెలుతురు',
  'date.this_week': 'ఈ వారం',
  'date.this_month': 'ఈ నెల',
  'date.this_year': 'ఈ సంవత్సరం',

  // Dashboard additional
  'dashboard.title': 'డాష్‌బోర్డ్',
  'dashboard.recent_transactions': 'కనీస కలెక్షన్లు',
  'dashboard.date': 'తేదీ',
  'dashboard.customer': 'కస్టమర్',
  'dashboard.amount': 'మొత్తం',
  'status_label': 'స్థితి',
  'dashboard.no_transactions': 'ఇప్పటికి కలెక్షన్లు నమోదు చేయబడలేదు',
  'dashboard.view_reports': 'రిపోర్ట్స్ వీక్షించండి',
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLanguage = new BehaviorSubject<Language>('en');
  currentLanguage$ = this.currentLanguage.asObservable();
  language = signal<Language>('en');

  private translations: Record<Language, Translations> = {
    en: englishTranslations,
    te: teluguTranslations,
  };

  /**
   * Get translation for a key
   */
  get(key: string, lang?: Language): string {
    const language = lang || this.language();
    const translations = this.translations[language];
    return translations[key] || key;
  }

  /**
   * Change to a different language
   * Note: This uses a subject-based approach so pipes update without reload
   */
  changeLanguage(lang: Language): void {
    this.language.set(lang);
    this.currentLanguage.next(lang);
    localStorage.setItem('finance-audit-pro-language', lang);
  }

  /**
   * Update the current language for all subscribers
   * This is called by the language switcher component
   */
  updateLanguage(lang: Language): void {
    this.changeLanguage(lang);
  }

  /**
   * Initialize language from localStorage
   */
  initialize(): void {
    const savedLanguage = localStorage.getItem('finance-audit-pro-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'te')) {
      this.language.set(savedLanguage);
      this.currentLanguage.next(savedLanguage);
    }
  }

  /**
   * Check if current language is Telugu
   */
  isTelugu(): boolean {
    return this.language() === 'te';
  }

  /**
   * Check if current language is English
   */
  isEnglish(): boolean {
    return this.language() === 'en';
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): { code: Language; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'te', name: 'తెలుగు' },
    ];
  }
}