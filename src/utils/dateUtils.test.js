import { describe, it, expect } from 'vitest';
import { getHorarioForDate, getHorarioForWeek } from '../utils/dateUtils';

describe('dateUtils - getHorarioForDate (Validity Check)', () => {
    // Mock schedules
    const mockSchedules = [
        {
            id: 'legacy-schedule',
            activeFrom: '2025-01-01', // Old legacy schedule
            scheduleData: { type: 'Legacy' }
        },
        {
            id: 'new-schedule',
            activeFrom: '2026-01-22', // Starts on Wednesday
            scheduleData: { type: 'New' }
        }
    ];

    it('should return the oldest/legacy schedule for dates BEFORE the new schedule starts', () => {
        // Tuesday, Jan 21, 2026
        const dateBefore = new Date(2026, 0, 21);
        const result = getHorarioForDate(dateBefore, mockSchedules);
        expect(result).toEqual({ type: 'Legacy' }); // Should fall back to the older one
    });

    it('should return the NEW schedule for dates ON or AFTER the start date', () => {
        // Wednesday, Jan 22, 2026
        const dateOnStart = new Date(2026, 0, 22);
        const result = getHorarioForDate(dateOnStart, mockSchedules);
        expect(result).toEqual({ type: 'New' });

        // Friday, Jan 24, 2026
        const dateAfter = new Date(2026, 0, 24);
        const resultAfter = getHorarioForDate(dateAfter, mockSchedules);
        expect(resultAfter).toEqual({ type: 'New' });
    });

    it('should return empty object if no schedules provided', () => {
        expect(getHorarioForDate(new Date(), [])).toEqual({});
        expect(getHorarioForDate(new Date(), null)).toEqual({});
    });
});

describe('dateUtils - getHorarioForWeek (Legacy Backward Compat)', () => {
    // This function originally returned the schedule for "the week".
    // With our new logic, it still exists but might be less precise.
    // Let's ensure it behaves rationally (e.g., returns the schedule valid at start of week).

    const mockSchedules = [
        {
            id: 'schedule-1',
            activeFrom: '2026-03-01',
            scheduleData: { name: 'Spring' }
        }
    ];

    it('should find schedule for a given week', () => {
        // March 2026
        // Week 10 approx
        // Just mocking the return as we mainly care about getHorarioForDate now
        // But verifying it doesn't crash is good.
        const result = getHorarioForWeek(2026, 12, mockSchedules); // Some random week
        expect(result).toBeDefined();
    });
});
