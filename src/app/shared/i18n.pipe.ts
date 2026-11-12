import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 'i18n',
  pure: false,
  standalone: true,
})
export class I18nPipe implements PipeTransform {
  private readonly _i18nService = inject(I18nService);

  transform(key: string): string {
    return this._i18nService.get(key);
  }
}