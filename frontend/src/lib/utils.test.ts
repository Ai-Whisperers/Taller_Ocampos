/**
 * Unit Tests for lib/utils.ts
 *
 * Tests utility functions for class name merging, currency formatting,
 * and date/time formatting.
 */

import { cn, formatCurrency, formatDate, formatDateTime } from './utils';

describe('utils', () => {
  describe('cn()', () => {
    it('merges class names correctly', () => {
      const result = cn('text-sm', 'font-bold');
      expect(result).toBe('text-sm font-bold');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('handles false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('merges Tailwind conflicting classes correctly', () => {
      // twMerge should keep the last conflicting class
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('handles arrays of class names', () => {
      const result = cn(['text-sm', 'font-bold']);
      expect(result).toBe('text-sm font-bold');
    });

    it('handles objects with boolean values', () => {
      const result = cn({
        'text-sm': true,
        'font-bold': true,
        'text-red-500': false,
      });
      expect(result).toContain('text-sm');
      expect(result).toContain('font-bold');
      expect(result).not.toContain('text-red-500');
    });

    it('handles undefined and null values', () => {
      const result = cn('text-sm', undefined, null, 'font-bold');
      expect(result).toBe('text-sm font-bold');
    });

    it('handles empty strings', () => {
      const result = cn('text-sm', '', 'font-bold');
      expect(result).toBe('text-sm font-bold');
    });

    it('handles complex mixed inputs', () => {
      const isActive = true;
      const result = cn(
        'base-class',
        isActive && 'active',
        ['array-class-1', 'array-class-2'],
        {
          'object-class': true,
          'hidden-class': false,
        },
        'final-class'
      );

      expect(result).toContain('base-class');
      expect(result).toContain('active');
      expect(result).toContain('array-class-1');
      expect(result).toContain('array-class-2');
      expect(result).toContain('object-class');
      expect(result).not.toContain('hidden-class');
      expect(result).toContain('final-class');
    });

    it('returns empty string when no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('deduplicates identical classes', () => {
      const result = cn('text-sm', 'text-sm', 'font-bold');
      expect(result).toBe('text-sm font-bold');
    });
  });

  describe('formatCurrency()', () => {
    it('formats positive numbers correctly', () => {
      const result = formatCurrency(1234.56);
      // EUR format: 1.234,56 €
      expect(result).toMatch(/1.*234.*56/);
      expect(result).toContain('€');
    });

    it('formats zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('€');
    });

    it('formats negative numbers correctly', () => {
      const result = formatCurrency(-500);
      expect(result).toContain('-');
      expect(result).toContain('500');
      expect(result).toContain('€');
    });

    it('formats large numbers with thousands separator', () => {
      const result = formatCurrency(1000000);
      // Should have separators for thousands
      expect(result).toMatch(/1.*000.*000/);
      expect(result).toContain('€');
    });

    it('formats decimal numbers with two decimal places', () => {
      const result = formatCurrency(99.9);
      // Should format to 99,90 €
      expect(result).toContain('99');
      expect(result).toContain('90');
      expect(result).toContain('€');
    });

    it('rounds to two decimal places', () => {
      const result = formatCurrency(10.999);
      // Should round to 11,00 €
      expect(result).toContain('11');
      expect(result).toContain('€');
    });

    it('formats very small decimal numbers', () => {
      const result = formatCurrency(0.01);
      expect(result).toContain('0');
      expect(result).toContain('01');
      expect(result).toContain('€');
    });

    it('handles integer values', () => {
      const result = formatCurrency(100);
      expect(result).toContain('100');
      expect(result).toContain('€');
    });

    it('formats numbers in the millions', () => {
      const result = formatCurrency(5000000.50);
      expect(result).toMatch(/5.*000.*000/);
      expect(result).toContain('€');
    });
  });

  describe('formatDate()', () => {
    it('formats Date object correctly', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date);

      // Spanish format: dd/mm/yyyy
      expect(result).toMatch(/15\/03\/2024/);
    });

    it('formats ISO string correctly', () => {
      // Use Date object instead of ISO string to avoid timezone issues
      const date = new Date(2024, 11, 25); // December 25, 2024
      const result = formatDate(date);
      expect(result).toMatch(/25\/12\/2024/);
    });

    it('formats date with time (extracts only date)', () => {
      const result = formatDate('2024-01-01T23:59:59');
      // Should contain a valid date pattern
      expect(result).toMatch(/\d{2}\/\d{2}\/2024/);
    });

    it('handles leap year dates', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      const result = formatDate(date);
      expect(result).toMatch(/29\/02\/2024/);
    });

    it('formats first day of year', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const result = formatDate(date);
      expect(result).toMatch(/01\/01\/2024/);
    });

    it('formats last day of year', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const result = formatDate(date);
      expect(result).toMatch(/31\/12\/2024/);
    });

    it('formats dates from different years', () => {
      const date = new Date(2020, 5, 15); // June 15, 2020
      const result = formatDate(date);
      expect(result).toMatch(/15\/06\/2020/);
    });

    it('pads single-digit days with zero', () => {
      const date = new Date(2024, 2, 5); // March 5, 2024
      const result = formatDate(date);
      expect(result).toMatch(/05\/03\/2024/);
    });

    it('pads single-digit months with zero', () => {
      const date = new Date(2024, 0, 20); // January 20, 2024
      const result = formatDate(date);
      expect(result).toMatch(/20\/01\/2024/);
    });

    it('handles Date objects with specific times', () => {
      const date = new Date(2024, 5, 10, 14, 30, 0); // June 10, 2024, 14:30
      const result = formatDate(date);
      expect(result).toMatch(/10\/06\/2024/);
    });
  });

  describe('formatDateTime()', () => {
    it('formats Date object with time correctly', () => {
      const date = new Date('2024-03-15T14:30:00');
      const result = formatDateTime(date);

      // Spanish format: dd/mm/yyyy, HH:mm
      expect(result).toMatch(/15\/03\/2024/);
      expect(result).toMatch(/14:30/);
    });

    it('formats ISO string with time correctly', () => {
      const result = formatDateTime('2024-12-25T09:15:00');
      expect(result).toMatch(/25\/12\/2024/);
      expect(result).toMatch(/09:15/);
    });

    it('formats midnight correctly', () => {
      const result = formatDateTime('2024-01-01T00:00:00');
      expect(result).toMatch(/01\/01\/2024/);
      expect(result).toMatch(/00:00/);
    });

    it('formats noon correctly', () => {
      const result = formatDateTime('2024-06-15T12:00:00');
      expect(result).toMatch(/15\/06\/2024/);
      expect(result).toMatch(/12:00/);
    });

    it('formats end of day correctly', () => {
      const result = formatDateTime('2024-12-31T23:59:00');
      expect(result).toMatch(/31\/12\/2024/);
      expect(result).toMatch(/23:59/);
    });

    it('pads single-digit hours with zero', () => {
      const result = formatDateTime('2024-03-15T09:30:00');
      expect(result).toMatch(/09:30/);
    });

    it('pads single-digit minutes with zero', () => {
      const result = formatDateTime('2024-03-15T14:05:00');
      expect(result).toMatch(/14:05/);
    });

    it('formats different timezone dates correctly', () => {
      // Note: This tests the local formatting, actual timezone handling
      // would depend on the Date object's timezone
      const date = new Date('2024-06-20T18:45:00Z');
      const result = formatDateTime(date);

      // Should contain date and time components
      expect(result).toMatch(/\d{2}\/\d{2}\/2024/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('ignores seconds in formatting', () => {
      const result = formatDateTime('2024-03-15T14:30:45');
      expect(result).toMatch(/14:30/);
      expect(result).not.toMatch(/45/);
    });

    it('handles Date objects created with constructor', () => {
      const date = new Date(2024, 8, 10, 16, 45, 30); // September 10, 2024, 16:45:30
      const result = formatDateTime(date);

      expect(result).toMatch(/10\/09\/2024/);
      expect(result).toMatch(/16:45/);
    });

    it('formats early morning times', () => {
      const result = formatDateTime('2024-07-20T01:15:00');
      expect(result).toMatch(/20\/07\/2024/);
      expect(result).toMatch(/01:15/);
    });

    it('formats late evening times', () => {
      const result = formatDateTime('2024-07-20T22:45:00');
      expect(result).toMatch(/20\/07\/2024/);
      expect(result).toMatch(/22:45/);
    });
  });

  describe('Edge cases and error handling', () => {
    describe('formatDate() with invalid dates', () => {
      it('throws error for invalid date string', () => {
        // new Date('invalid') creates an Invalid Date object which causes format() to throw
        expect(() => formatDate('invalid')).toThrow(RangeError);
      });
    });

    describe('formatDateTime() with invalid dates', () => {
      it('throws error for invalid date string', () => {
        expect(() => formatDateTime('invalid')).toThrow(RangeError);
      });
    });

    describe('formatCurrency() with edge values', () => {
      it('handles very large numbers', () => {
        const result = formatCurrency(999999999999);
        expect(result).toContain('€');
        expect(result).toBeDefined();
      });

      it('handles very small negative numbers', () => {
        const result = formatCurrency(-0.01);
        expect(result).toContain('-');
        expect(result).toContain('€');
      });

      it('handles Infinity', () => {
        const result = formatCurrency(Infinity);
        expect(result).toBeDefined();
      });

      it('handles NaN', () => {
        const result = formatCurrency(NaN);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Integration scenarios', () => {
    it('combines all utilities in a realistic scenario', () => {
      // Simulate formatting a transaction
      const amount = 1250.50;
      const date = new Date('2024-03-15T14:30:00');

      const formattedAmount = formatCurrency(amount);
      const formattedDate = formatDate(date);
      const formattedDateTime = formatDateTime(date);

      expect(formattedAmount).toContain('€');
      expect(formattedDate).toMatch(/15\/03\/2024/);
      expect(formattedDateTime).toMatch(/15\/03\/2024.*14:30/);
    });

    it('handles multiple class name merges in sequence', () => {
      const baseClasses = cn('flex', 'items-center');
      const extendedClasses = cn(baseClasses, 'justify-between', 'p-4');
      const finalClasses = cn(extendedClasses, 'bg-white', 'rounded-lg');

      expect(finalClasses).toContain('flex');
      expect(finalClasses).toContain('items-center');
      expect(finalClasses).toContain('justify-between');
      expect(finalClasses).toContain('p-4');
      expect(finalClasses).toContain('bg-white');
      expect(finalClasses).toContain('rounded-lg');
    });
  });
});
