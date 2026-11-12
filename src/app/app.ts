import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './shared/app-shell.component';
import { I18nService } from './shared/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent],
  template: `
    <app-shell>
      <router-outlet></router-outlet>
    </app-shell>
  `,
  styleUrl: './app.css',
})
export class App {
  private i18n = inject(I18nService);

  constructor() {
    this.i18n.initialize();
  }
}