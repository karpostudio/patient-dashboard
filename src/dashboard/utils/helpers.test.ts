import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatToGermanDate, calculateAge, determineAgeGroup, calculateWaitingTime } from './helpers';
import { PatientSubmission } from '../types';
import { createPatient } from '../../__tests__/fixtures/patients';

describe('formatToGermanDate', () => {
  it('formats a valid ISO date string', () => {
    expect(formatToGermanDate('2024-01-15')).toBe('15.01.2024');
  });

  it('formats a valid datetime string', () => {
    expect(formatToGermanDate('2023-12-25T10:00:00.000Z')).toBe('25.12.2023');
  });

  it('returns "Ungültiges Datum" for invalid date', () => {
    expect(formatToGermanDate('not-a-date')).toBe('Ungültiges Datum');
  });

  it('returns "Ungültiges Datum" for empty string', () => {
    expect(formatToGermanDate('')).toBe('Ungültiges Datum');
  });

  it('pads single-digit day and month', () => {
    expect(formatToGermanDate('2024-03-05')).toBe('05.03.2024');
  });
});

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates age for a standard date', () => {
    expect(calculateAge('1990-05-15')).toBe('34 Jahre, 1 Mo');
  });

  it('handles birthday not yet passed this year', () => {
    // Jun 15 - Dec 25 = birthday hasn't passed yet, so age = 33, months = 6 (from Dec to Jun)
    expect(calculateAge('1990-12-25')).toBe('33 Jahre, 6 Mo');
  });

  it('handles a newborn (same year)', () => {
    expect(calculateAge('2024-01-01')).toBe('0 Jahre, 5 Mo');
  });

  it('returns "Ungültiges Datum" for invalid input', () => {
    expect(calculateAge('invalid')).toBe('Ungültiges Datum');
  });
});

describe('determineAgeGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "kind" for age <= 12', () => {
    // Born 2012-06-15 => exactly 12
    expect(determineAgeGroup('2012-06-15')).toBe('kind');
  });

  it('returns "teen" for age 13', () => {
    // Born 2011-06-14 => 13
    expect(determineAgeGroup('2011-06-14')).toBe('teen');
  });

  it('returns "teen" for age 17', () => {
    // Born 2007-06-15 => exactly 17
    expect(determineAgeGroup('2007-06-15')).toBe('teen');
  });

  it('returns "erwachsene" for age 18', () => {
    // Born 2006-06-15 => exactly 18
    expect(determineAgeGroup('2006-06-15')).toBe('erwachsene');
  });

  it('returns null for undefined', () => {
    expect(determineAgeGroup(undefined)).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(determineAgeGroup('not-a-date')).toBeNull();
  });

  it('returns null for age > 120', () => {
    expect(determineAgeGroup('1800-01-01')).toBeNull();
  });
});

describe('calculateWaitingTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zero for empty array', () => {
    expect(calculateWaitingTime([])).toEqual({ months: 0, days: 0 });
  });

  it('calculates waiting time from single submission date_5bd8', () => {
    const submissions = [
      createPatient({ submissions: { date_5bd8: '2024-01-15' } }),
    ];
    const result = calculateWaitingTime(submissions);
    // Jan 15 to Jun 15 = ~152 days = 5 months, 2 days
    expect(result.months).toBe(5);
    expect(result.days).toBe(2);
  });

  it('uses oldest submission when multiple exist', () => {
    const submissions = [
      createPatient({ _id: '1', submissions: { date_5bd8: '2024-03-01' } }),
      createPatient({ _id: '2', submissions: { date_5bd8: '2024-01-01' } }),
      createPatient({ _id: '3', submissions: { date_5bd8: '2024-05-01' } }),
    ];
    const result = calculateWaitingTime(submissions);
    // Jan 1 to Jun 15 = 166 days = 5 months, 16 days
    expect(result.months).toBe(5);
    expect(result.days).toBe(16);
  });

  it('falls back to _createdDate if date_5bd8 is missing', () => {
    const submissions = [
      createPatient({
        _createdDate: '2024-02-15T10:00:00.000Z',
        submissions: { date_5bd8: undefined },
      }),
    ];
    const result = calculateWaitingTime(submissions);
    // Feb 15 to Jun 15 = 121 days = 4 months, 0 remaining days (121 / 30 = 4, 121 % 30 = 1... but UTC offset)
    expect(result.months).toBe(4);
    expect(result.days).toBe(0);
  });
});
