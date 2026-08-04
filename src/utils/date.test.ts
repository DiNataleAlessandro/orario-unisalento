import { describe, it, expect } from 'vitest';
import { formatDateForAPI, getAcademicYear } from './date';

describe('Date Utilities', () => {
  describe('formatDateForAPI', () => {
    it('formats single-digit day and month correctly', () => {
      const date = new Date(2026, 4, 5); // May 5th, 2026 (month is 0-indexed)
      expect(formatDateForAPI(date)).toBe('05-05-2026');
    });

    it('formats double-digit day and month correctly', () => {
      const date = new Date(2026, 11, 25); // Dec 25th, 2026
      expect(formatDateForAPI(date)).toBe('25-12-2026');
    });
  });

  describe('getAcademicYear', () => {
    it('returns the previous year for dates before August', () => {
      // March 2027 -> Academic year is 2026
      const date = new Date(2027, 2, 15);
      expect(getAcademicYear(date)).toBe('2026');
    });

    it('returns the current year for August', () => {
      // August 2026 -> Academic year is 2026
      const date = new Date(2026, 7, 4);
      expect(getAcademicYear(date)).toBe('2026');
    });

    it('returns the current year for dates after August', () => {
      // October 2026 -> Academic year is 2026
      const date = new Date(2026, 9, 10);
      expect(getAcademicYear(date)).toBe('2026');
    });
  });
});
