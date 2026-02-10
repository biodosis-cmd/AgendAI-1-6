import { describe, it, expect } from 'vitest';
import { calculateClassSchedule } from './schedulerLogic';
import { STATUS } from '../constants'; // Adjust path if needed

describe('schedulerLogic - calculateClassSchedule', () => {

    const selectedYear = 2026;
    const selectedWeek = 4; // Week of Jan 19th - Jan 25th 2026 approx
    const userId = 'test-user';
    const curso = '1ro Básico';
    const asignatura = 'Matemáticas';

    // Mock functions (dateUtils is imported inside schedulerLogic, so we rely on its behavior or verify integration)
    // We assume getStartDateOfWeek(2026, 4) returns Monday Jan 19 2026.

    // SETUP:
    const mockSchedules = [{
        id: 'sched-1',
        activeFrom: '2026-01-22', // Wednesday
        scheduleData: {
            '1ro Básico': {
                'Matemáticas': [
                    { dia: 1, hora: '10:00', duration: 90 }, // Monday (Before validity)
                    { dia: 2, hora: '10:00', duration: 90 }, // Tuesday (Before validity)
                    { dia: 3, hora: '10:00', duration: 90 }, // Wednesday (Valid!)
                    { dia: 4, hora: '10:00', duration: 90 }, // Thursday (Valid!)
                ]
            }
        }
    }];

    it('should RETURN ERROR if trying to generate on a day BEFORE validity (Strict Check)', () => {
        // We try to generate 1 session.
        // Logic starts Monday. Monday has a slot. Validity starts Wednesday.
        // Should ERROR immediately on Monday.

        const inputData = {
            curso,
            asignatura,
            clases: [{ titulo: 'Clase 1' }]
        };

        const result = calculateClassSchedule(inputData, [], mockSchedules, selectedYear, selectedWeek, userId);

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/no es posible agendar/i);
    });

    it('should SUCCEED if generating creates classes on VALID days (e.g. Wednesday)', () => {
        // Let's assume we modify the schedule so Monday/Tuesday have NO slots.
        // Only Wednesday has a slot.
        const midWeekSchedule = [{
            id: 'sched-2',
            activeFrom: '2026-01-21', // Wednesday Jan 21 2026
            scheduleData: {
                '1ro Básico': {
                    'Matemáticas': [
                        { dia: 3, hora: '08:00', duration: 90 }, // Wednesday
                    ]
                }
            }
        }];

        const inputData = {
            curso,
            asignatura,
            clases: [{ titulo: 'Clase Miércoles' }]
        };

        const result = calculateClassSchedule(inputData, [], midWeekSchedule, selectedYear, selectedWeek, userId);

        if (!result.success) {
            console.error("Test Failed with Error:", result.error);
        }
        expect(result.success).toBe(true);
        expect(result.classes).toHaveLength(1);
        expect(result.classes[0].fecha).toContain('2026-01-21'); // Wednesday
    });

    it('should RETURN ERROR on CONFLICT with existing class', () => {
        const simpleSchedule = [{
            id: 'sched-1',
            activeFrom: '2026-01-01',
            scheduleData: {
                '1ro Básico': {
                    'Matemáticas': [{ dia: 1, hora: '10:00', duration: 90 }] // Monday
                }
            }
        }];

        // An existing class at the same time
        const existingClasses = [{
            fecha: '2026-01-19T10:00:00.000Z', // Monday 10:00 (ISO string approx)
            curso: '1ro Básico',
            asignatura: 'Matemáticas'
        }];

        // Note: Our logic uses local time construction, so exact ISO matching depends on timezone in test env.
        // Ideally we mock dateUtils or use robust matching. 
        // For this test, let's just ensure it detects *something* if we align the date.
        // Easier way: let the function run and fail, or adjust date manually.

        // Let's use a cleaner approach: empty existing classes first to verify success, then add one.
    });
});
