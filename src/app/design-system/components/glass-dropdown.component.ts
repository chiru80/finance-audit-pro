import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface GlassDropdownItem {
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

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
        [disabled]="disabled"
        [ngClass]="{ 'has-value': selectedValue !== null }"
      >
        <span class="glass-dropdown-label">
          @if (selectedValue !== null && selectedItem) {
            {{ selectedItem.label }}
          } @else {
            <span class="placeholder">{{ placeholder }}</span>
          }
        </span>
        <svg class="glass-dropdown-chevron" [class.rotated]="open" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Panel -->
      @if (open && !disabled) {
        <div
          class="glass-dropdown-panel"
          [ngClass]="positionClasses"
          (click)="$event.stopPropagation()"
        >
          <!-- Specular Highlight -->
          <div class="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          @if (searchable) {
            <div class="glass-dropdown-search">
              <input
                type="text"
                class="glass-dropdown-search-input"
                placeholder="Search..."
                (input)="filterItems($event)"
                #searchInput
              />
            </div>
          }

          <div class="glass-dropdown-items">
            @if (filteredItems.length === 0) {
              <div class="glass-dropdown-empty">
                {{ emptyMessage }}
              </div>
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
                    (click)="selectItem(item)"
                    (keydown.enter)="selectItem(item)"
                    (keydown.space)="$event.preventDefault(); selectItem(item)"
                    tabindex="-1"
                  >
                    @if (item.icon) {
                      <span class="glass-dropdown-item-icon" [innerHTML]="getSafeIconHtml(item.icon)"></span>
                    }
                    <span class="glass-dropdown-item-label">{{ item.label }}</span>
                    @if (item.value === selectedValue) {
                      <svg class="glass-dropdown-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  </button>
                }
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
  styles: [`
    :host {
      display: inline-block;
      width: 100%;
    }

    .glass-dropdown-root {
      position: relative;
      display: inline-flex;
      flex-direction: column;
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
      background: #18243A;
      border: 1px solid #263449;
      color: #F8FAFC;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }

    .glass-dropdown-trigger:hover:not(:disabled) {
      background: #1E2D47;
      border-color: #334460;
    }

    .glass-dropdown-trigger:focus {
      outline: none;
      box-shadow: 0 0 0 2px #2563EB;
      border-color: #2563EB;
    }

    .glass-dropdown-trigger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .glass-dropdown-trigger.has-value {
      color: #F8FAFC;
    }

    .glass-dropdown-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .glass-dropdown-label .placeholder {
      color: #64748B;
    }

    .glass-dropdown-chevron {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #94A3B8;
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
      background: #111827;
      border: 1px solid #263449;
      border-radius: 12px;
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.65);
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
      border-bottom: 1px solid #263449;
    }

    .glass-dropdown-search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      background: #0F172A;
      border: 1px solid #263449;
      color: #F8FAFC;
      font-size: 0.875rem;
      outline: none;
    }

    .glass-dropdown-search-input:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .glass-dropdown-search-input::placeholder {
      color: #64748B;
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
      color: #F8FAFC;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .glass-dropdown-item:hover:not(.disabled) {
      background: #18243A;
    }

    .glass-dropdown-item.selected {
      background: rgba(37, 99, 235, 0.15);
      color: #60A5FA;
    }

    .glass-dropdown-item.selected:hover {
      background: rgba(37, 99, 235, 0.25);
    }

    .glass-dropdown-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .glass-dropdown-item.danger {
      color: #F87171;
    }

    .glass-dropdown-item.danger:hover:not(.disabled) {
      background: rgba(239, 68, 68, 0.15);
    }

    .glass-dropdown-item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #94A3B8;
    }

    .glass-dropdown-item.selected .glass-dropdown-item-icon {
      color: #60A5FA;
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
      color: #38BDF8;
    }

    /* Divider */
    .glass-dropdown-divider {
      height: 1px;
      background: #263449;
      margin: 0.25rem 0.5rem;
    }

    /* Empty */
    .glass-dropdown-empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: #64748B;
      font-size: 0.875rem;
    }

    /* Footer */
    .glass-dropdown-footer {
      padding: 0.75rem;
      border-top: 1px solid #263449;
      background: #0F172A;
    }

    /* Interactive */
    .interactive-false .glass-dropdown-trigger {
      cursor: not-allowed;
    }
  `],
})
export class GlassDropdownComponent {
  @Input() items: GlassDropdownItem[] = [];
  @Input() placeholder = 'Select an option';
  @Input() selectedValue: any = null;
  @Input() disabled = false;
  @Input() searchable = false;
  @Input() position: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
  @Input() emptyMessage = 'No options found';

  @Output() selectionChange = new EventEmitter<any>();

  @ContentChild('footer') footerTemplate?: TemplateRef<any>;

  open = false;
  filteredItems: GlassDropdownItem[] = [];
  selectedItem: GlassDropdownItem | null = null;
  private elementRef = inject(ElementRef);

  get interactiveClasses(): string {
    return this.disabled ? 'interactive-false' : 'interactive-true';
  }

  get positionClasses(): string {
    return `position-${this.position}`;
  }

  ngOnInit() {
    this.filteredItems = [...this.items];
    this.updateSelectedItem();
  }

  ngOnChanges() {
    this.updateSelectedItem();
    this.filteredItems = [...this.items];
  }

  private updateSelectedItem() {
    if (this.selectedValue !== null) {
      this.selectedItem = this.items.find(item => item.value === this.selectedValue) || null;
    } else {
      this.selectedItem = null;
    }
  }

  toggle() {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) {
      this.filteredItems = [...this.items];
    }
  }

  close() {
    this.open = false;
  }

  selectItem(item: GlassDropdownItem) {
    if (item.disabled) return;
    this.selectedValue = item.value;
    this.selectedItem = item;
    this.selectionChange.emit(item.value);
    this.close();
  }

  filterItems(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.divider || item.label.toLowerCase().includes(query)
    );
  }

  getSafeIconHtml(icon: string): SafeHtml {
    const sanitizer = inject(DomSanitizer);
    if (!icon) return sanitizer.bypassSecurityTrustHtml('');
    const svgStr = icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return sanitizer.bypassSecurityTrustHtml(
        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`
      );
    }
    return sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.open && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}