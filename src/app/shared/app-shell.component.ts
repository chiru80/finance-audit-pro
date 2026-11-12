import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './app-header.component';
import { AppSidebarComponent } from './app-sidebar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppSidebarComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-shell flex h-screen w-full overflow-hidden bg-background-primary">
        <app-sidebar />
        <div class="flex-1 flex flex-col overflow-hidden">
          <app-header />
          <main class="flex-1 overflow-auto p-4 md:p-6 bg-background-secondary">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <div class="min-h-screen w-full bg-background-primary">
        <router-outlet></router-outlet>
      </div>
    }
  `,
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  readonly authService = inject(AuthService);
}
