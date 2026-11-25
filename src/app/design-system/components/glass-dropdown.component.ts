import type { TemplateRef, AfterViewInit, OnDestroy, OnChanges } from '@angular/core';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
  forwardRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

export interface GlassDropdownItem {
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  isNew?: boolean; // For "Add new" items
}

/**
 * Shared ARIA role for the dropdown's listbox. Declared as a const so the
 * template and the item component stay in sync - a mismatched role string
 * here is one of the most common ways dropdowns break screen readers.
 */
export const GLASS_DROPDOWN_LISTBOX_ROLE = 'listbox' as const;

@Component({
  selector: 'glass-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="glass-dropdown-root"
      [ngClass]="interactiveClasses"
      (clickOutside)="close()"
      #dropdownRef
    >
      <!-- Trigger Button -->
      <button
        type="button"
        class="glass-dropdown-trigger"
        (click)="toggle()"
        [disabled]="isDisabled"
        [attr.aria-expanded]="open"
        [attr.aria-controls]="'glass-dropdown-listbox-' + dropdownId"
        [attr.aria-haspopup]="'listbox'"
        [ngClass]="{ 'has-value': selectedValue !== null && selectedValue !== undefined }"
      >
        <span class="glass-dropdown-label">
          @if (selectedValue !== null && selectedValue !== undefined && selectedItem) {
            {{ selectedItem.label }}
          } @else {
            <span class="placeholder">{{ placeholder }}</span>
          }
        </span>
        <span id="glass-dropdown-label-{{ dropdownId }}" class="sr-only">{{ placeholder }}</span>
        <svg
          class="glass-dropdown-chevron"
          [class.rotated]="open"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Dropdown Panel -->
      @if (open && !isDisabled) {
        <div
          class="glass-dropdown-panel"
          [ngClass]="positionClasses"
          (click)="$event.stopPropagation()"
          [attr.id]="'glass-dropdown-listbox-' + dropdownId"
          role="listbox"
          [attr.aria-labelledby]="'glass-dropdown-label-' + dropdownId"
        >
          <!-- Specular Highlight -->

          @if (searchable) {
            <div class="glass-dropdown-search">
              <input
                type="text"
                class="glass-dropdown-search-input"
                placeholder="Search..."
                aria-label="Search options"
                (input)="filterItems($event)"
                #searchInput
              />
            </div>
          }

          <div class="glass-dropdown-items">
            @if (filteredItems.length === 0) {
              @if (searchable) {
                <button
                  type="button"
                  class="glass-dropdown-item glass-dropdown-add-new"
                  (click)="emitAddNew()"
                  tabindex="-1"
                >
                  <svg
                    class="glass-dropdown-item-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span class="glass-dropdown-item-label"
                    >Add "{{ searchQuery }}" as new village</span
                  >
                </button>
              } @else {
                <div class="glass-dropdown-empty">
                  {{ emptyMessage }}
                </div>
              }
            } @else {
              @for (item of filteredItems; track item.value) {
                @if (item.divider) {
                  <div class="glass-dropdown-divider"></div>
                } @else {
                  <button
                    type="button"
                    class="glass-dropdown-item"
                    [class.disabled]="item.disabled"
                    [class.danger]="item.danger"
                    [class.selected]="item.value === selectedValue"
                    [class.is-new]="item.isNew"
                    [attr.data-value]="item.value"
                    (click)="selectItem(item)"
                    (keydown.enter)="selectItem(item)"
                    (keydown.space)="$event.preventDefault(); selectItem(item)"
                    tabindex="-1"
                  >
                    @if (item.icon) {
                      <span
                        class="glass-dropdown-item-icon"
                        [innerHTML]="getSafeIconHtml(item.icon)"
                      ></span>
                    }
                    <span class="glass-dropdown-item-label">{{ item.label }}</span>
                    @if (item.value === selectedValue) {
                      <svg
                        class="glass-dropdown-check"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    }
                  </button>
                }
              }
              @if (searchable) {
                <button
                  type="button"
                  class="glass-dropdown-item glass-dropdown-add-new"
                  (click)="emitAddNew()"
                  tabindex="-1"
                >
                  <svg
                    class="glass-dropdown-item-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span class="glass-dropdown-item-label"
                    >Add "{{ searchQuery }}" as new village</span
                  >
                </button>
              }
            }
          </div>

          @if (footerTemplate) {
            <div class="glass-dropdown-footer">
              <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        width: 100%;
      }

      .glass-dropdown-root {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 100%;
      }

      /* Trigger Button */
      .glass-dropdown-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 42px;
        padding: 0 1rem;
        border-radius: 12px;
        background: var(--glass-surface-elevated);
        border: 1px solid var(--glass-border-subtle);
        color: var(--text-primary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
      }

      .glass-dropdown-trigger:hover:not(:disabled) {
        background: var(--color-surface-hover);
        border-color: var(--color-border-medium);
      }

      .glass-dropdown-trigger:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-accent);
        border-color: var(--primary-accent);
      }

      .glass-dropdown-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .glass-dropdown-trigger.has-value {
        color: var(--text-primary);
      }

      .glass-dropdown-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .glass-dropdown-label .placeholder {
        color: var(--text-muted);
      }

      .glass-dropdown-chevron {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: var(--text-secondary);
        transition: transform 0.2s ease;
      }

      .glass-dropdown-chevron.rotated {
        transform: rotate(180deg);
      }

      /* Dropdown Panel */
      .glass-dropdown-panel {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        min-width: 100%;
        max-height: 300px;
        background: color-mix(in srgb, var(--bg-secondary) 96%, transparent);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border: 1px solid var(--glass-border-crisp, var(--glass-border-subtle));
        border-radius: 12px;
        box-shadow: var(--glass-shadow-lg);
        z-index: 50;
        overflow: hidden;
        animation: dropdownSlide 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes dropdownSlide {
        0% {
          opacity: 0;
          transform: translateY(-8px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .position-top .glass-dropdown-panel {
        top: auto;
        bottom: calc(100% + 8px);
        animation: dropdownSlideUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes dropdownSlideUp {
        0% {
          opacity: 0;
          transform: translateY(8px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .position-right .glass-dropdown-panel {
        left: auto;
        right: 0;
      }

      /* Search */
      .glass-dropdown-search {
        padding: 0.75rem;
        border-bottom: 1px solid var(--glass-border-subtle);
      }

      .glass-dropdown-search-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        background: var(--glass-surface-dock);
        border: 1px solid var(--glass-border-subtle);
        color: var(--text-primary);
        font-size: 0.875rem;
        outline: none;
      }

      .glass-dropdown-search-input:focus {
        border-color: var(--primary-accent);
        box-shadow: 0 0 0 2px var(--color-primary-border);
      }

      .glass-dropdown-search-input::placeholder {
        color: var(--text-muted);
      }

      /* Items */
      .glass-dropdown-items {
        max-height: 250px;
        overflow-y: auto;
        padding: 0.25rem;
      }

      .glass-dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.625rem 0.75rem;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.1s ease;
      }

      .glass-dropdown-item:hover:not(.disabled) {
        background: var(--glass-surface-elevated);
      }

      .glass-dropdown-item.selected {
        background: var(--color-primary-tint);
        color: var(--color-info-text);
      }

      .glass-dropdown-item.selected:hover {
        background: var(--color-primary-border);
      }

      .glass-dropdown-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .glass-dropdown-item.danger {
        color: var(--color-danger-text);
      }

      .glass-dropdown-item.danger:hover:not(.disabled) {
        background: var(--color-danger-tint);
      }

      .glass-dropdown-add-new {
        color: var(--color-info-text) !important;
        font-weight: 600;
      }

      .glass-dropdown-add-new:hover {
        background: var(--color-primary-tint) !important;
      }

      .glass-dropdown-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: var(--text-secondary);
      }

      .glass-dropdown-item.selected .glass-dropdown-item-icon {
        color: var(--color-info-text);
      }

      .glass-dropdown-item-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .glass-dropdown-check {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: var(--color-info-text);
      }

      /* Divider */
      .glass-dropdown-divider {
        height: 1px;
        background: var(--glass-border-subtle);
        margin: 0.25rem 0.5rem;
      }

      /* Empty */
      .glass-dropdown-empty {
        padding: 1.5rem 1rem;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.875rem;
      }

      /* Footer */
      .glass-dropdown-footer {
        padding: 0.75rem;
        border-top: 1px solid var(--glass-border-subtle);
        background: var(--glass-surface-dock);
      }

      /* Interactive */
      .interactive-false .glass-dropdown-trigger {
        cursor: not-allowed;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GlassDropdownComponent),
      multi: true,
    },
  ],
})
export class GlassDropdownComponent
  implements AfterViewInit, OnDestroy, OnChanges, ControlValueAccessor
{
  @Input() items: GlassDropdownItem[] = [];
  @Input() placeholder = 'Select an option';
  @Input() selectedValue: any = null;
  @Input() disabled = false;
  @Input() searchable = false;
  @Input() position: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
  @Input() emptyMessage = 'No options found';
  @Input() hasError = false;

  @Output() selectionChange = new EventEmitter<any>();
  @Output() addNew = new EventEmitter<string>(); // Emits the search query when user wants to add new

  @ContentChild('footer') footerTemplate?: TemplateRef<any>;

  open = false;
  filteredItems: GlassDropdownItem[] = [];
  selectedItem: GlassDropdownItem | null = null;
  searchQuery = '';
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private dropdownId = 'dd-' + Math.random().toString(36).substring(2, 9);
  private currentFocusedIndex = -1;
  private formDisabled = false;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get interactiveClasses(): string {
    return this.isDisabled ? 'interactive-false' : 'interactive-true';
  }

  get positionClasses(): string {
    return `position-${this.position}`;
  }

  get dropdownIdValue(): string {
    return this.dropdownId;
  }

  ngOnInit() {
    this.filteredItems = [...this.items];
    this.updateSelectedItem();
  }

  ngOnChanges() {
    this.updateSelectedItem();
    const lowerQuery = this.searchQuery.trim().toLowerCase();
    this.filteredItems = lowerQuery
      ? this.items.filter(
          (item) => item.divider || item.label.toLowerCase().includes(lowerQuery),
        )
      : [...this.items];
  }

  writeValue(value: any): void {
    this.selectedValue = value !== undefined && value !== '' ? value : null;
    this.updateSelectedItem();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    // Initialize focus management after view is ready
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private updateSelectedItem() {
    if (this.selectedValue !== null && this.selectedValue !== undefined && this.selectedValue !== '') {
      this.selectedItem = this.items.find((item) => item.value === this.selectedValue) || null;
    } else {
      this.selectedItem = null;
    }
  }

  toggle() {
    if (this.isDisabled) return;
    this.open = !this.open;
    if (this.open) {
      this.searchQuery = '';
      this.filteredItems = [...this.items];
      this.currentFocusedIndex = this.selectedItem
        ? this.filteredItems.findIndex((i) => i.value === this.selectedValue)
        : 0;
      // Focus the first item after open
      setTimeout(() => {
        const searchEl = this.elementRef.nativeElement.querySelector(
          '.glass-dropdown-search-input',
        ) as HTMLElement | null;
        if (searchEl) {
          searchEl.focus();
          return;
        }
        const firstItem = this.elementRef.nativeElement.querySelector('.glass-dropdown-item');
        if (firstItem) {
          firstItem.focus();
        }
      }, 0);
    } else {
      this.onTouched();
    }
  }

  close() {
    if (this.open) {
      this.open = false;
      this.currentFocusedIndex = -1;
      this.onTouched();
    }
  }

  selectItem(item: GlassDropdownItem) {
    if (item.disabled) return;
    this.selectedValue = item.value;
    this.selectedItem = item;
    this.onChange(item.value);
    this.onTouched();
    this.selectionChange.emit(item.value);
    this.close();
    this.cdr.markForCheck();
  }

  focusPrevious() {
    const items = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.glass-dropdown-item:not(.disabled)'),
    );
    if (items.length === 0) return;

    this.currentFocusedIndex--;
    if (this.currentFocusedIndex < 0) {
      this.currentFocusedIndex = items.length - 1;
    }

    const el = items[this.currentFocusedIndex] as HTMLElement;
    el?.focus();
  }

  focusNext() {
    const items = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.glass-dropdown-item:not(.disabled)'),
    );
    if (items.length === 0) return;

    this.currentFocusedIndex++;
    if (this.currentFocusedIndex >= items.length) {
      this.currentFocusedIndex = 0;
    }

    const el = items[this.currentFocusedIndex] as HTMLElement;
    el?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.open) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious();
        break;
      case 'Enter':
        event.preventDefault();
        // Select the currently focused item
        const activeItem = document.activeElement as HTMLElement;
        if (activeItem?.classList?.contains('glass-dropdown-item')) {
          const value = activeItem?.getAttribute('data-value');
          if (value !== null && value !== undefined) {
            this.selectItem({
              label: activeItem.querySelector('.glass-dropdown-item-label')?.textContent || '',
              value,
            });
          }
        }
        break;
    }
  }

  filterItems(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    const lowerQuery = query.toLowerCase();
    this.filteredItems = this.items.filter(
      (item) => item.divider || item.label.toLowerCase().includes(lowerQuery),
    );
  }

  emitAddNew() {
    if (this.searchQuery.trim()) {
      this.addNew.emit(this.searchQuery.trim());
    }
    this.close();
  }

  getSafeIconHtml(icon: string): SafeHtml {
    if (!icon) return this.sanitizer.bypassSecurityTrustHtml('');
    const svgStr = icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`,
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.open && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
