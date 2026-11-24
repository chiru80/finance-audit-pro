import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { GlassCardComponent } from '../design-system/components/glass-card.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, GlassCardComponent],
  template: `
    <div class="space-y-6">
      <glass-card variant="elevated" customClass="p-5">
        <h2 class="text-lg font-bold text-[var(--text-primary)] mb-4">Audit Log</h2>
        @if (loading()) {
          <p>Loading...</p>
        } @else if (entries().length === 0) {
          <p class="text-[var(--text-muted)]">No audit entries.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left text-xs uppercase text-[var(--text-secondary)]">
                  <th class="py-2 px-3">When</th>
                  <th class="py-2 px-3">Action</th>
                  <th class="py-2 px-3">Table</th>
                  <th class="py-2 px-3">Record</th>
                </tr>
              </thead>
              <tbody>
                @for (e of entries(); track e.id) {
                  <tr class="border-t border-[var(--glass-border-subtle)]">
                    <td class="py-2 px-3 text-xs">{{ e.created_at | date: 'medium' }}</td>
                    <td class="py-2 px-3 font-mono text-xs">{{ e.action }}</td>
                    <td class="py-2 px-3">{{ e.table_name }}</td>
                    <td class="py-2 px-3 font-mono text-xs">{{ e.record_id }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </glass-card>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  private readonly _supabase = inject(SupabaseService);
  loading = signal(true);
  entries = signal<any[]>([]);

  async ngOnInit() {
    const { data, error } = await this._supabase.client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) this.entries.set(data || []);
    this.loading.set(false);
  }
}
