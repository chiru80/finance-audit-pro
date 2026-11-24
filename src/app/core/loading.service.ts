import { Injectable, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);
  private pending = 0;

  constructor(router: Router) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.pending++;
        this.isLoading.set(true);
      } else if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      ) {
        this.pending = Math.max(0, this.pending - 1);
        if (this.pending === 0) this.isLoading.set(false);
      }
    });
  }

  show() { this.pending++; this.isLoading.set(true); }
  hide() { this.pending = Math.max(0, this.pending - 1); if (this.pending === 0) this.isLoading.set(false); }
}
