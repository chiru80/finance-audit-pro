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

  // Collections & Absences
  'collections.tracker': 'Weekly Tracker',
  'collections.absences': 'Absence Log',
  'collections.carried_forward': 'Carried Forward',
  'collections.mark_absent': 'Mark Absent',
  'collections.collect': 'Collect Due',
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
  'dashboard.total_customers': 'మొత్తం కస్టమర్లు',
  'dashboard.todays_collection': 'ఈరోజు వసూలు',
  'dashboard.weekly_collection': 'వారపు వసూలు',
  'dashboard.monthly_collection': 'నెలవారీ వసూలు',
  'dashboard.total_outstanding': 'మొత్తం బాకీ',
  'dashboard.pending_payments': 'పెండింగ్ చెల్లింపులు',

  // Dashboard actions
  'dashboard.quick_actions': 'వేగవంత చర్యలు',
  'dashboard.view_all': 'అన్నీ చూడండి',
  'dashboard.add_customer': 'కస్టమర్‌ను జోడించండి',
  'dashboard.add_collection': 'కలెక్షన్ నమోదు చేయండి',

  // General
  'loading': 'లోడ్ అవుతోంది...',
  'error': 'లోపం',
  'retry': 'మళ్లీ ప్రయత్నించండి',
  'cancel': 'రద్దు చేయండి',
  'confirm': 'నిర్ధారించండి',
  'save': 'సేవ్ చేయండి',
  'edit': 'సవరించండి',
  'delete': 'తొలగించండి',
  'actions': 'చర్యలు',

  // Common UI
  'search': 'వెతకండి',
  'filter': 'ఫిల్టర్',
  'sort': 'క్రమబద్ధీకరించు',
  'refresh': 'తాజాకరించు',
  'export': 'ఎగుమతి చేయండి',
  'import': 'దిగుమతి చేయండి',

  // Status
  'status.paid': 'చెల్లించబడింది',
  'status.pending': 'పెండింగ్',
  'status.overdue': 'గడువు ముగిసింది',
  'status.active': 'క్రియాశీలం',
  'status.inactive': 'నిష్క్రియం',

  // Authentication
  'login.title': 'తిరిగి స్వాగతం',
  'login.subtitle': 'మీ ఖాతాలోకి ప్రవేశించండి',
  'login.email': 'ఇమెయిల్',
  'login.password': 'పాస్‌వర్డ్',
  'login.forgot_password': 'పాస్‌వర్డ్ మర్చిపోయారా?',
  'login.sign_in': 'సైన్ ఇన్',
  'login.sign_up': 'ఖాతా తెరవండి',
  'login.create_account': 'ఖాతా లేదా? ఇప్పుడే ప్రారంభించండి',
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
  'empty.nodata': 'సమాచారం అందుబాటులో లేదు',
  'empty.nocustomers': 'కస్టమర్లు కనుగొనబడలేదు',
  'empty.nocollections': 'ఎటువంటి కలెక్షన్లు లేవు',

  // Theme
  'theme.light': 'లైట్ మోడ్',
  'theme.dark': 'డార్క్ మోడ్',

  // Language
  'language.english': 'English',
  'language.telugu': 'తెలుగు',

  // Date formats
  'date.today': 'ఈరోజు',
  'date.yesterday': 'నిన్న',
  'date.this_week': 'ఈ వారం',
  'date.this_month': 'ఈ నెల',
  'date.this_year': 'ఈ సంవత్సరం',

  // Dashboard additional
  'dashboard.title': 'డాష్‌బోర్డ్',
  'dashboard.recent_transactions': 'ఇటీవలి లావాదేవీలు',
  'dashboard.date': 'తేదీ',
  'dashboard.customer': 'కస్టమర్',
  'dashboard.amount': 'మొత్తం',
  'dashboard.status_label': 'స్థితి',
  'dashboard.no_transactions': 'ఇప్పటివరకు ఎటువంటి లావాదేవీలు లేవు',
  'dashboard.view_reports': 'నివేదికలు చూడండి',

  // Collections & Absences
  'collections.tracker': 'వారాధిక ట్రాకర్',
  'collections.absences': 'గైర్హాజరు లాగ్',
  'collections.carried_forward': 'ముందుకు తీసుకెళ్లబడింది',
  'collections.mark_absent': 'గైర్హాజరుగా గుర్తించండి',
  'collections.collect': 'సంచయం స్వీకరించండి',
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