import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'glass-switch',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GlassSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      [attr.aria-label]="ariaLabel"
      [disabled]="disabled"
      (click)="toggle()"
      (keydown.space)="$event.preventDefault(); toggle()"
      (keydown.enter)="$event.preventDefault(); toggle()"
      class="glass-switch-track relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] focus:ring-offset-2"
      [class.checked]="checked"
      [class.disabled]="disabled"
    >
      <!-- Liquid Specular Line -->
      <span
        class="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-full bg-gradient-to-r from-transparent via-[var(--glass-border-crisp)] to-transparent"
      ></span>

      <!-- Sliding Thumb -->
      <span
        class="glass-switch-thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--bg-secondary)] shadow-md transition-transform duration-300 ease-in-out"
        [class.translate-x-5]="checked"
        [class.translate-x-1]="!checked"
      >
        <!-- Subtle Specular Reflection on Thumb -->
        <span
          class="absolute inset-x-0 top-0.5 h-[1px] rounded-full bg-[var(--glass-border-crisp)]"
        ></span>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }

      .glass-switch-track {
        background: var(--glass-surface-dock);
        border: 1px solid var(--glass-border-subtle);
        box-shadow: var(--glass-shadow-inner);
        transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        padding-top: 3px;
      }

      .glass-switch-track.checked {
        background: var(--primary-accent);
        border-color: var(--primary-hover);
        box-shadow: none;
      }

      .glass-switch-thumb {
        transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
        box-shadow: var(--glass-shadow-sm);
      }

      .disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    `,
  ],
})
export class GlassSwitchComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
    this.onChange(this.checked);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (val: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
