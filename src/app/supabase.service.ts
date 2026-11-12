import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly _supabaseUrl = environment.supabaseUrl;
  private readonly _supabaseAnonKey = environment.supabaseAnonKey;

  private readonly _client = createClient(this._supabaseUrl, this._supabaseAnonKey);

  get client(): SupabaseClient {
    return this._client;
  }

  /** Get the current session user */
  getSession() {
    return this._client.auth.getSession();
  }

  /** Get the current user */
  getUser() {
    return this._client.auth.getUser();
  }

  /** Subscribe to auth state changes */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this._client.auth.onAuthStateChange(callback);
  }

  /** Sign in with email and password */
  signIn(email: string, password: string) {
    return this._client.auth.signInWithPassword({ email, password });
  }

  /** Sign up with email and password */
  signUp(email: string, password: string) {
    return this._client.auth.signUp({ email, password });
  }

  /** Sign out */
  signOut() {
    return this._client.auth.signOut();
  }

  /** Sign in with Google OAuth */
  signInWithGoogle() {
    return this._client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }
}