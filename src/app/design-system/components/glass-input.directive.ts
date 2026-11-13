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
      'duration-150',
      'outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
      'focus:ring-offset-[#0B1120]',
    ];

    if (this.hasError) {
      base.push(
        'border-[#EF4444]',
        'bg-[#EF4444]/10',
        'text-[#F8FAFC]',
        'placeholder:text-[#64748B]',
        'focus:border-[#EF4444]',
        'focus:ring-[#EF4444]/30'
      );
    } else {
      base.push(
        'border-[#263449]',
        'bg-[#0F172A]',
        'text-[#F8FAFC]',
        'placeholder:text-[#64748B]',
        'focus:border-[#2563EB]',
        'focus:ring-[#2563EB]/30',
        'focus:bg-[#0F172A]'
      );
    }

    return base.join(' ');
  }

  @HostBinding('style.boxShadow')
  get boxShadow(): string {
    return this.hasError
      ? '0 0 0 1px #EF4444'
      : 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.4)';
  }
}
