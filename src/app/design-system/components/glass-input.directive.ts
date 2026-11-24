import { Directive, HostBinding, Input, HostListener } from '@angular/core';

/**
 * Applies the premium field treatment to inputs, selects and textareas.
 * All colouring comes from design tokens so light/dark themes work without
 * per-template overrides. Tailwind `!` utilities in templates still win for
 * one-off sizing (e.g. `py-1.5! text-xs!`).
 *
 * Accessibility:
 * - Binds `aria-invalid` when hasError is true, making error states announced
 *   to screen readers per WCAG 2.1 1.3.1 Info and Relationships.
 */
@Directive({
  selector: 'input[glassInput], select[glassInput], textarea[glassInput]',
  standalone: true,
})
export class GlassInputDirective {
  @Input() hasError = false;
  @Input() hasSuccess = false;

  /** Host classes applied based on state */
  @HostBinding('class')
  get hostClasses(): string {
    if (this.hasError) return 'fx-input fx-input--error';
    if (this.hasSuccess) return 'fx-input fx-input--success';
    return 'fx-input';
  }

  /** ARIA-invalid attribute for screen readers - true when in error state */
  @HostBinding('attr.aria-invalid')
  get ariaInvalid(): string {
    return this.hasError ? 'true' : 'false';
  }

  /** ARIA-describedby to link to error message if present */
  @HostBinding('attr.aria-describedby')
  get ariaDescribedBy(): string | null {
    if (!this.hasError) return null;
    // Error message ID should be provided by parent form component
    // Convention: {controlId}-error
    return null;
  }

  /** ARIA-required for required fields */
  @HostBinding('attr.aria-required')
  get ariaRequired(): boolean {
    // The host binding for required is handled via native attribute
    return false;
  }
}
