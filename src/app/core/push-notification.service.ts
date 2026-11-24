import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  readonly supported = signal(this.swPush.isEnabled);
  readonly subscribed = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async subscribe(vapidPublicKey: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (!this.swPush.isEnabled) {
        throw new Error('Push notifications are not supported in this browser/build.');
      }
      const sub = await this.swPush.requestSubscription({ serverPublicKey: vapidPublicKey });
      const json = sub.toJSON();
      const keys = json.keys || {};
      const user = this.auth.user();
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await this.supabase.client.from('push_subscriptions').upsert({
        profile_id: user.id,
        endpoint: json.endpoint,
        p256dh: keys['p256dh'],
        auth: keys['auth'],
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      this.subscribed.set(true);
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Subscription failed');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async unsubscribe(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const user = this.auth.user();
        if (user?.id) {
          await this.supabase.client
            .from('push_subscriptions')
            .delete()
            .eq('profile_id', user.id)
            .eq('endpoint', endpoint);
        }
      }
      this.subscribed.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unsubscribe failed');
    } finally {
      this.loading.set(false);
    }
  }

  async refreshStatus(): Promise<void> {
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      this.subscribed.set(!!sub);
    } catch {
      this.subscribed.set(false);
    }
  }
}
