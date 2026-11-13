import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: 'input[glassInput], select[glassInput], textarea[glassInput]',
  standalone: true,
})
export class GlassInputDirective {
  @Input() hasError = false;

  @HostBinding('class')
  get hostClasses(): string {
    const base = [
      'block',
      'w-full',
      'rounded-xl',
      'border',
      'px-3.5',
      'py-2.5',
      'text-sm',
      'transition-all',
      'duration-200',
      'outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
    ];

    if (this.hasError) {
      base.push(
        'border-red-400',
        'bg-red-50/40',
        'text-red-900',
        'focus:border-red-500',
        'focus:ring-red-500/25'
      );
    } else {
      base.push(
        'border-slate-200/80',
        'bg-white/70',
        'text-slate-900',
        'placeholder:text-slate-400',
        'focus:border-blue-500',
        'focus:ring-blue-500/25',
        'focus:bg-white/95'
      );
    }

    return base.join(' ');
  }

  @HostBinding('style.backdropFilter')
  backdropFilter = 'blur(12px) saturate(180%)';

  @HostBinding('style.-webkitBackdropFilter')
  webkitBackdropFilter = 'blur(12px) saturate(180%)';

  @HostBinding('style.boxShadow')
  get boxShadow(): string {
    return this.hasError
      ? 'inset 0 1px 2px 0 rgba(239, 68, 68, 0.08)'
      : 'inset 0 1px 2px 0 rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)';
  }
}
