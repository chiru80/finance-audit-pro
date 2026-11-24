import { Injectable, signal, computed, NgZone, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OfflineStatusService {
  private readonly zone = inject(NgZone);
  private readonly online = signal<boolean>(navigator.onLine);

  readonly isOnline = computed(() => this.online());
  readonly isOffline = computed(() => !this.online());

  constructor() {
    window.addEventListener('online', () => this.zone.run(() => this.online.set(true)));
    window.addEventListener('offline', () => this.zone.run(() => this.online.set(false)));
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
}
