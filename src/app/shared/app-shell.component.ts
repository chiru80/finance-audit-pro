import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './app-header.component';
import { AppSidebarComponent } from './app-sidebar.component';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../auth/auth.service';
import { OfflineBannerComponent } from './offline-banner.component';
import { InstallBannerComponent } from './install-banner.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    AppHeaderComponent,
    AppSidebarComponent,
    OfflineBannerComponent,
    InstallBannerComponent,
  ],
  template: `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div
      class="app-shell flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]"
    >
      @if (authService.isAuthenticated()) {
        <app-sidebar />

        @if (sidebarService.isOpen()) {
          <button
            type="button"
            class="fx-sidebar-scrim"
            aria-label="Close navigation"
            (click)="sidebarService.close()"
          ></button>
        }
      }

      <div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <app-offline-banner />
        <app-install-banner />
        @if (authService.isAuthenticated()) {
          <app-header />
        }

        <main
          id="main-content"
          class="fx-canvas fx-main flex-1 overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)]"
          [ngClass]="authService.isAuthenticated() ? 'p-5 sm:p-8' : ''"
        >
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);

  private readonly mobileBreakpoint = 1024;
  private isMobileViewport =
    typeof window !== 'undefined' && window.innerWidth < this.mobileBreakpoint;

  constructor() {
    if (this.isMobileViewport) {
      this.sidebarService.close();
    }
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < this.mobileBreakpoint;
    if (isMobile === this.isMobileViewport) return;

    this.isMobileViewport = isMobile;
    if (isMobile) {
      this.sidebarService.close();
    } else {
      this.sidebarService.open();
    }
  }
}
