import { Injectable, inject, signal, computed } from '@angular/core';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _supabaseService = inject(SupabaseService);

  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _creatingProfile = signal<boolean>(false);

  readonly user = computed(() => this._user());
  readonly session = computed(() => this._session());
  readonly isLoading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly creatingProfile = computed(() => this._creatingProfile());

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await this._supabaseService.getSession();

      if (sessionError) {
        this._error.set(sessionError.message);
      } else {
        this._session.set(session);
        this._user.set(session?.user ?? null);
      }
    } catch (err) {
      console.warn('Auth initialization session fetch failed:', err);
      this._user.set(null);
      this._session.set(null);
    } finally {
      this._loading.set(false);
    }

    // Subscribe to auth state changes safely
    try {
      this._supabaseService.client.auth.onAuthStateChange((event, newSession) => {
        this._session.set(newSession);
        this._user.set(newSession?.user ?? null);
        this._loading.set(false);

        // Auto-create profile for new signups (including OAuth)
        if (event === 'SIGNED_IN' && newSession?.user) {
          this.ensureProfileExists(newSession.user);
        }
      });
    } catch (err) {
      console.warn('Auth state subscription failed:', err);
    }
  }

  /**
   * Ensure a profile exists for the given user
   * This handles OAuth signups and cases where profile was deleted
   * Uses upsert to prevent race conditions on concurrent SIGNED_IN events
   */
  private async ensureProfileExists(user: User) {
    try {
      const fullName =
        ((user.user_metadata as Record<string, unknown>)['full_name'] as string) ||
        ((user.user_metadata as Record<string, unknown>)['name'] as string) ||
        '';

      // Ignore duplicate IDs so SIGNED_IN events never reset saved profile preferences.
      const { error } = await this._supabaseService.client.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName || null,
          language: 'en',
          theme_mode: 'light',
          weekly_due_day: 1,
          weekly_due_amount: 50000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );

      if (error) {
        console.error('Failed to ensure profile exists:', error);
      }
    } catch (e) {
      console.error('Failed to ensure profile exists:', e);
    }
  }

  async signIn(email: string, password: string) {
    this._error.set(null);
    const { data, error } = await this._supabaseService.signIn(email, password);

    if (error) {
      this._error.set(error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  async signUp(email: string, password: string) {
    this._error.set(null);
    const { data, error } = await this._supabaseService.signUp(email, password);

    if (error) {
      this._error.set(error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Sign in with Google OAuth
   * Initiates the OAuth flow which redirects to Google and back to the callback URL
   */
  async signInWithGoogle(): Promise<void> {
    const { error } = await this._supabaseService.signInWithGoogle();
    if (error) {
      this._error.set(error.message);
      throw new Error(error.message);
    }
    // The redirect happens automatically - user will be redirected to Google OAuth
  }

  /**
   * Create a profile for the newly signed up user
   * This is required because the profiles table uses id = auth.uid()
   * and must be created after the user is created in auth.users
   */
  async createProfileAfterSignup(
    user: User | null,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!user) {
      return { success: false, error: 'No user provided' };
    }

    this._creatingProfile.set(true);

    try {
      // Fetch default weekly due from settings table
      const { data: settingsData } = await this._supabaseService.client
        .from('settings')
        .select('value')
        .eq('key', 'default_weekly_due_amount')
        .single();

      // Parse validated integer; fall back to 50000 paise (₹500) on any parse failure
      const rawValue = settingsData?.value;
      let defaultWeeklyDueAmount = 50000;
      if (rawValue !== null && rawValue !== undefined) {
        const parsed = parseInt(rawValue, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          defaultWeeklyDueAmount = parsed;
        }
      }

      const { error } = await this._supabaseService.client
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName || null,
          language: 'en',
          theme_mode: 'light',
          weekly_due_day: 1,
          weekly_due_amount: defaultWeeklyDueAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, error: errMsg };
    } finally {
      this._creatingProfile.set(false);
    }
  }

  async signOut() {
    const { error } = await this._supabaseService.signOut();

    if (error) {
      this._error.set(error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  getClient(): SupabaseClient {
    return this._supabaseService.client;
  }
}
