import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
      [disabled]="disabled"
      (click)="toggle()"
      (keydown.space)="$event.preventDefault(); toggle()"
      (keydown.enter)="$event.preventDefault(); toggle()"
      class="glass-switch-track relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2"
      [class.checked]="checked"
      [class.disabled]="disabled"
    >
      <!-- Liquid Specular Line -->
      <span class="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent"></span>

      <!-- Sliding Thumb -->
      <span
        class="glass-switch-thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
        [class.translate-x-5]="checked"
        [class.translate-x-1]="!checked"
      >
        <!-- Subtle Specular Reflection on Thumb -->
        <span class="absolute inset-x-0 top-0.5 h-[1px] rounded-full bg-white/90"></span>
      </span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .glass-switch-track {
      background: #0F172A;
      border: 1px solid #263449;
      box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.4);
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      padding-top: 3px;
    }

    .glass-switch-track.checked {
      background: #2563EB;
      border-color: #3B82F6;
      box-shadow: 0 0 12px 0 rgba(37, 99, 235, 0.4);
    }

    .glass-switch-thumb {
      transition-timing-function: var(--glass-spring-easing, cubic-bezier(0.16, 1, 0.3, 1));
      box-shadow: 0 2px 5px 0 rgba(15, 23, 42, 0.25), 0 0 1px 0 rgba(15, 23, 42, 0.15);
    }

    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  `],
})
export class GlassSwitchComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() disabled = false;
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

