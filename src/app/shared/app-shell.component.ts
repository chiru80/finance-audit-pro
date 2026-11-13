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
    <div class="app-shell flex flex-row h-screen w-full overflow-hidden bg-slate-50">
      @if (authService.isAuthenticated()) {
        <app-sidebar />
      }
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        @if (authService.isAuthenticated()) {
          <app-header />
        }
        <main [class]="authService.isAuthenticated() ? 'flex-1 overflow-y-auto p-6 md:p-8' : 'flex-1 overflow-y-auto bg-white'">
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

