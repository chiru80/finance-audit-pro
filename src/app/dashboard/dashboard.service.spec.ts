import { describe, expect, it } from 'vitest';
import { aggregateMonthlyCollections } from './dashboard.service';

describe('aggregateMonthlyCollections', () => {
  const now = new Date('2026-03-15T12:00:00.000Z');

  it('returns six ordered calendar months and sums paise values within the range', () => {
    const result = aggregateMonthlyCollections(
      [
        { date: '2025-10-02', amount: 1000 },
        { date: '2025-10-20', amount: '250' },
        { date: '2026-03-07', amount: 75 },
        { date: '2025-09-30', amount: 9000 },
        { date: '2026-04-01', amount: 8000 },
      ],
      now,
    );

    expect(result).toEqual([
      { month: '2025-10', amount: 1250 },
      { month: '2025-11', amount: 0 },
      { month: '2025-12', amount: 0 },
      { month: '2026-01', amount: 0 },
      { month: '2026-02', amount: 0 },
      { month: '2026-03', amount: 75 },
    ]);
  });

  it('returns explicit zero-value months when no paid collections exist', () => {
    const result = aggregateMonthlyCollections([], now);

    expect(result).toHaveLength(6);
    expect(result.every(({ amount }) => amount === 0)).toBe(true);
  });
});
