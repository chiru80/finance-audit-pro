import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassSkeletonComponent } from './glass-skeleton.component';
import { GlassEmptyStateComponent } from './glass-empty-state.component';

export interface GlassTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  template?: TemplateRef<any>;
  formatter?: (value: any, row: T) => string | TemplateRef<any>;
}

export interface GlassTableAction<T> {
  label: string;
  icon?: string;
  variant?: 'filled' | 'glass' | 'tinted' | 'danger';
  size?: 'sm' | 'md';
  action: (row: T, event: MouseEvent) => void;
  disabled?: (row: T) => boolean;
  show?: (row: T) => boolean;
}

@Component({
  selector: 'glass-table',
  standalone: true,
  imports: [CommonModule, GlassSkeletonComponent, GlassEmptyStateComponent],
  template: `
    <div class="glass-table-root" [ngClass]="interactiveClasses">
      <!-- Specular Highlight -->
      <div class="glass-specular-top pointer-events-none absolute inset-x-0 top-0 h-[1px]"></div>

      <!-- Loading State -->
      @if (loading) {
        <div class="glass-table-loading">
          <glass-skeleton variant="table" />
        </div>
      } @else {
        <!-- Table Container -->
        <div class="glass-table-container">
          <table class="glass-table">
            <thead>
              <tr class="glass-table-head">
                @for (column of columns; track column.key) {
                  <th
                    [style.width]="column.width"
                    [class.sortable]="column.sortable"
                    (click)="column.sortable && sort.emit({ column: column.key, direction: getNextSortDirection(column.key) })"
                    class="glass-table-th"
                  >
                    <div class="glass-table-th-content">
                      <span>{{ column.header }}</span>
                      @if (column.sortable) {
                        <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4.5h18M3 9v6h6v-6h6M3 13.5h18M3 18v6h6v-6h6M3 9h6v6H3M3 18v6h6v-6H3" />
                        </svg>
                      }
                    </div>
                  </th>
                }
                @if (actions && actions.length > 0) {
                  <th class="glass-table-th" style="width: 120px;">
                    <span class="glass-table-th-content">Actions</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody class="glass-table-body">
              @if (data && data.length > 0) {
                @for (row of data; track trackByFn(row); let i = $index) {
                  <tr
                    class="glass-table-row"
                    [class.alternate]="i % 2 === 1"
                    [class.selected]="selectedRow === row"
                    (click)="selectRow.emit(row)"
                    (mouseenter)="hoveredRow = row"
                    (mouseleave)="hoveredRow = null"
                  >
                    @for (column of columns; track column.key) {
                      <td class="glass-table-td">
                        @if (column.template) {
                          <ng-container *ngTemplateOutlet="column.template; context: { $implicit: row, value: this.getRowValue(row, column.key) }"></ng-container>
                        } @else if (column.formatter) {
                          <span [innerHTML]="getFormatterHtml(column.formatter(this.getRowValue(row, column.key), row))"></span>
                        } @else {
                          <span>{{ this.getRowValue(row, column.key) }}</span>
                        }
                      </td>
                    }
                    @if (actions && actions.length > 0) {
                      <td class="glass-table-td glass-table-actions">
                        <div class="glass-table-action-group">
                          @for (action of actions; track action.label) {
                            @if (!action.show || action.show(row)) {
                              <button
                                type="button"
                                class="glass-table-action-btn"
                                [class]="action.variant || 'glass'"
                                [class.size-sm]="action.size === 'sm'"
                                [disabled]="action.disabled?.(row)"
                                (click)="action.action(row, $event); $event.stopPropagation()"
                                (mouseenter)="$event.stopPropagation()"
                              >
                                @if (action.icon) {
                                  <span [innerHTML]="getSafeIconHtml(action.icon)"></span>
                                }
                                <span>{{ action.label }}</span>
                              </button>
                            }
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              } @else {
                <!-- Empty State Row -->
                <tr class="glass-table-empty-row">
                  <td [attr.colspan]="columns.length + (actions && actions.length > 0 ? 1 : 0)" class="glass-table-empty-cell">
                    <glass-empty-state
                      [title]="emptyTitle || 'No data available'"
                      [description]="emptyDescription || ''"
                      [variant]="emptyVariant"
                      [size]="'sm'"
                      [actionLabel]="emptyActionLabel"
                      [actionVariant]="emptyActionVariant"
                      (action)="emptyAction.emit($event)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination && data && data.length > 0) {
          <div class="glass-table-pagination">
            <div class="glass-table-pagination-info">
              Showing {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} to
              {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems) }}
              of {{ pagination.totalItems }} results
            </div>
            <div class="glass-table-pagination-controls">
              <button
                type="button"
                class="glass-pagination-btn"
                [disabled]="pagination.currentPage === 1"
                (click)="pageChange.emit(pagination.currentPage - 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                class="glass-pagination-btn"
                [disabled]="pagination.currentPage * pagination.pageSize >= pagination.totalItems"
                (click)="pageChange.emit(pagination.currentPage + 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .glass-table-root {
      position: relative;
      background: #151F32;
      border: 1px solid #263449;
      border-radius: 16px;
      overflow: hidden;
    }

    .glass-table-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .glass-table-container {
      overflow-x: auto;
    }

    .glass-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    /* Header */
    .glass-table-head {
      background: #0F172A;
      border-bottom: 1px solid #263449;
    }

    .glass-table-th {
      padding: 1rem 1.25rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      white-space: nowrap;
    }

    .glass-table-th-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .glass-table-th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .glass-table-th.sortable:hover {
      color: #F8FAFC;
    }

    /* Body */
    .glass-table-body {
      background: #151F32;
    }

    .glass-table-row {
      border-bottom: 1px solid #263449;
      transition: background-color 0.15s ease;
    }

    .glass-table-row:last-child {
      border-bottom: none;
    }

    .glass-table-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .glass-table-row.alternate {
      background: rgba(255, 255, 255, 0.01);
    }

    .glass-table-row.selected {
      background: rgba(37, 99, 235, 0.1);
    }

    .glass-table-td {
      padding: 1rem 1.25rem;
      color: #F8FAFC;
      vertical-align: middle;
    }

    .glass-table-actions {
      padding: 0.75rem 1.25rem;
    }

    .glass-table-action-group {
      display: inline-flex;
      gap: 0.5rem;
    }

    .glass-table-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .glass-table-action-btn.filled {
      background: #2563EB;
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.15);
    }
    .glass-table-action-btn.filled:hover:not(:disabled) {
      background: #3B82F6;
    }

    .glass-table-action-btn.glass {
      background: #18243A;
      color: #F8FAFC;
      border-color: #263449;
    }
    .glass-table-action-btn.glass:hover:not(:disabled) {
      background: #1E2D47;
      border-color: #334460;
    }

    .glass-table-action-btn.tinted {
      background: rgba(37, 99, 235, 0.15);
      color: #60A5FA;
      border-color: rgba(37, 99, 235, 0.30);
    }
    .glass-table-action-btn.tinted:hover:not(:disabled) {
      background: rgba(37, 99, 235, 0.25);
      color: #93C5FD;
    }

    .glass-table-action-btn.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border-color: rgba(239, 68, 68, 0.30);
    }
    .glass-table-action-btn.danger:hover:not(:disabled) {
      background: #EF4444;
      color: #FFFFFF;
    }

    .glass-table-action-btn.size-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.7rem;
    }

    .glass-table-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty State */
    .glass-table-empty-row {
      height: 200px;
    }

    .glass-table-empty-cell {
      padding: 2rem;
      vertical-align: middle;
    }

    /* Pagination */
    .glass-table-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid #263449;
      background: #0F172A;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .glass-table-pagination-info {
      font-size: 0.875rem;
      color: #94A3B8;
    }

    .glass-table-pagination-controls {
      display: inline-flex;
      gap: 0.5rem;
    }

    .glass-pagination-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #18243A;
      border: 1px solid #263449;
      color: #94A3B8;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .glass-pagination-btn:hover:not(:disabled) {
      background: #1E2D47;
      border-color: #334460;
      color: #F8FAFC;
    }

    .glass-pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Interactive Classes */
    .interactive-true .glass-table-row {
      cursor: pointer;
    }

    .interactive-true .glass-table-row:hover {
      background: rgba(37, 99, 235, 0.08);
    }
  `],
})
export class GlassTableComponent<T = any> {
  @Input() data: T[] = [];
  @Input() columns: GlassTableColumn<T>[] = [];
  @Input() actions: GlassTableAction<T>[] = [];
  @Input() loading = false;
  @Input() trackByFn: (row: T) => any = (row: any) => row.id;
  @Input() interactive = false;
  @Input() selectedRow: T | null = null;
  @Input() hoveredRow: T | null = null;

  // Empty State
  @Input() emptyTitle = '';
  @Input() emptyDescription = '';
  @Input() emptyVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() emptyActionLabel = '';
  @Input() emptyActionVariant: 'filled' | 'glass' | 'tinted' | 'danger' = 'filled';

  // Pagination
  @Input() pagination: { currentPage: number; pageSize: number; totalItems: number } | null = null;

  @Output() sort = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() selectRow = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() emptyAction = new EventEmitter<MouseEvent>();

  private sortDirections: Record<string, 'asc' | 'desc'> = {};

  get interactiveClasses(): string {
    return this.interactive ? 'interactive-true' : 'interactive-false';
  }

  getNextSortDirection(column: string): 'asc' | 'desc' {
    const current = this.sortDirections[column] || 'asc';
    return current === 'asc' ? 'desc' : 'asc';
  }

  getFormatterHtml(result: string | TemplateRef<any>): string {
    if (typeof result === 'string') {
      return result;
    }
    return '';
  }

  getSafeIconHtml(icon: string): string {
    if (!icon) return '';
    const svgStr = icon.trim();
    if (!svgStr.startsWith('<svg')) {
      return `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgStr}</svg>`;
    }
    return svgStr;
  }

  protected Math = Math;

  getRowValue(row: T, key: string): any {
    return (row as any)[key];
  }
}