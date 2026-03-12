import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterSubmissions } from './useFilters';
import { FilterState } from '../types';
import { createPatient, createFlexiblePatient, createChild, createTeen, createAdult, createSubmissionList } from '../../__tests__/fixtures/patients';

const emptyFilters: FilterState = {
  selectedDay: null,
  selectedTimeSlots: [],
  selectedHomeVisit: [],
  selectedAgeGroups: [],
  selectedTreatment: [],
  searchTerm: '',
  showDuplicatesOnly: false,
};

describe('filterSubmissions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns all results when no filters are active', () => {
    const subs = createSubmissionList();
    expect(filterSubmissions(subs, emptyFilters)).toHaveLength(subs.length);
  });

  describe('search filter', () => {
    it('filters by last name (case-insensitive)', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { name_1: 'Müller', vorname: 'Hans' } }),
        createPatient({ _id: '2', submissions: { name_1: 'Schmidt', vorname: 'Anna' } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, searchTerm: 'müller' });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });

    it('filters by first name (case-insensitive)', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { name_1: 'Müller', vorname: 'Hans' } }),
        createPatient({ _id: '2', submissions: { name_1: 'Schmidt', vorname: 'Anna' } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, searchTerm: 'ANNA' });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('2');
    });
  });

  describe('day filter', () => {
    it('filters by day availability', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { montag: ['8-9'] } }),
        createPatient({ _id: '2', submissions: { montag: [] } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedDay: 'monday' });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });

    it('includes flexible patients regardless of day', () => {
      const subs = [
        createFlexiblePatient({ _id: 'flex-1' }),
        createPatient({ _id: '2', submissions: { montag: [] } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedDay: 'monday' });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('flex-1');
    });
  });

  describe('time slot filter', () => {
    it('filters by time slot on selected day', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { montag: ['8-9', '9-10'] } }),
        createPatient({ _id: '2', submissions: { montag: ['14-15'] } }),
      ];
      const result = filterSubmissions(subs, {
        ...emptyFilters,
        selectedDay: 'monday',
        selectedTimeSlots: ['8'],
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });

    it('uses every (AND) logic for multiple time slots', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { montag: ['8-9', '9-10'] } }),
        createPatient({ _id: '2', submissions: { montag: ['8-9'] } }),
      ];
      const result = filterSubmissions(subs, {
        ...emptyFilters,
        selectedDay: 'monday',
        selectedTimeSlots: ['8', '9'],
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });

    it('includes flexible patients regardless of time slots', () => {
      const subs = [createFlexiblePatient({ _id: 'flex-1' })];
      const result = filterSubmissions(subs, {
        ...emptyFilters,
        selectedTimeSlots: ['8'],
      });
      expect(result).toHaveLength(1);
    });

    it('without day selected, checks across all days', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { montag: [], dienstag: ['8-9'], mittwoch: [], donnerstag: [], freitag: [] } }),
      ];
      const result = filterSubmissions(subs, {
        ...emptyFilters,
        selectedTimeSlots: ['8'],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('home visit filter', () => {
    it('filters by home visit', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { wurde_ein_hausbesuch_verordnet: 'Ja' } }),
        createPatient({ _id: '2', submissions: { wurde_ein_hausbesuch_verordnet: 'Nein' } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedHomeVisit: ['Ja'] });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });
  });

  describe('treatment filter', () => {
    it('filters by treatment answer', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { waren_sie_schon_einmal_bei_uns_in_behandlung: 'Ja' } }),
        createPatient({ _id: '2', submissions: { waren_sie_schon_einmal_bei_uns_in_behandlung: 'Nein' } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedTreatment: ['Nein'] });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('2');
    });

    it('treats missing treatment answer as "Ja"', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { waren_sie_schon_einmal_bei_uns_in_behandlung: undefined } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedTreatment: ['Ja'] });
      expect(result).toHaveLength(1);
    });
  });

  describe('age group filter', () => {
    it('filters by age group', () => {
      const subs = [createChild({ _id: 'c' }), createTeen({ _id: 't' }), createAdult({ _id: 'a' })];
      const result = filterSubmissions(subs, { ...emptyFilters, selectedAgeGroups: ['kind'] });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('c');
    });
  });

  describe('duplicate filter', () => {
    it('shows only entries with duplicate names (counts from allSubmissions)', () => {
      const subs = [
        createPatient({ _id: '1', submissions: { name_1: 'Müller', vorname: 'Hans' } }),
        createPatient({ _id: '2', submissions: { name_1: 'Müller', vorname: 'Hans' } }),
        createPatient({ _id: '3', submissions: { name_1: 'Schmidt', vorname: 'Anna' } }),
      ];
      const result = filterSubmissions(subs, { ...emptyFilters, showDuplicatesOnly: true });
      expect(result).toHaveLength(2);
    });
  });

  describe('combined filters', () => {
    it('applies AND logic between multiple criteria', () => {
      const subs = [
        createPatient({
          _id: '1',
          submissions: {
            name_1: 'Müller',
            vorname: 'Hans',
            wurde_ein_hausbesuch_verordnet: 'Ja',
          },
        }),
        createPatient({
          _id: '2',
          submissions: {
            name_1: 'Müller',
            vorname: 'Fritz',
            wurde_ein_hausbesuch_verordnet: 'Nein',
          },
        }),
      ];
      const result = filterSubmissions(subs, {
        ...emptyFilters,
        searchTerm: 'müller',
        selectedHomeVisit: ['Ja'],
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('1');
    });
  });
});
