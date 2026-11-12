import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './app-header.component';
import { AppSidebarComponent } from './app-sidebar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, AppSidebarComponent],
  template: `
    <div class="app-shell flex h-screen w-full overflow-hidden bg-background-primary">
      @if (authService.isAuthenticated()) {
        <app-sidebar />
      }
      <div class="flex-1 flex flex-col overflow-hidden">
        @if (authService.isAuthenticated()) {
          <app-header />
        }
        <main [class]="authService.isAuthenticated() ? 'flex-1 overflow-auto p-4 md:p-6 bg-background-secondary' : 'flex-1 overflow-auto bg-background-primary'">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  readonly authService = inject(AuthService);
}

