import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private deferred: BeforeInstallPromptEvent | null = null;
  readonly canInstall = signal(false);
  readonly installed = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canInstall.set(false);
      this.deferred = null;
    });
  }

  async promptInstall(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.canInstall.set(false);
  }
}
