import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './shared/app-shell.component';
import { I18nService } from './shared/i18n.service';
import { LoadingService } from './core/loading.service';
import { RupeeLoaderComponent } from './shared/rupee-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent, RupeeLoaderComponent],
  template: `
    <app-rupee-loader></app-rupee-loader>
    <app-shell>
      <router-outlet></router-outlet>
    </app-shell>
  `,
  styleUrl: './app.css',
})
export class App {
  private i18n = inject(I18nService);
  private loading = inject(LoadingService);

  constructor() {
    this.i18n.initialize();
    void this.loading;
  }
}
