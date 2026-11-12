import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { App } from './app';
import { I18nService } from './shared/i18n.service';

describe('App', () => {
  it('should instantiate App component and initialize i18n', () => {
    const mockI18n = {
      initialize: vi.fn(),
    };

    const injector = Injector.create({
      providers: [{ provide: I18nService, useValue: mockI18n }],
    });

    const app = runInInjectionContext(injector, () => new App());
    expect(app).toBeTruthy();
    expect(mockI18n.initialize).toHaveBeenCalled();
  });
});
