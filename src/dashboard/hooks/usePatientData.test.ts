import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateAgeGroupsFromSubmissions, calculateGenderGroupsFromSubmissions } from './usePatientData';
import { createPatient } from '../../__tests__/fixtures/patients';

describe('calculateAgeGroupsFromSubmissions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts kids (age <= 12)', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geburtsdatum: '2015-01-01' } }), // 9 years
    ];
    expect(calculateAgeGroupsFromSubmissions(subs)).toEqual({ kids: 1, teenagers: 0, adults: 0 });
  });

  it('counts teenagers (age 13-17)', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geburtsdatum: '2010-01-01' } }), // 14 years
    ];
    expect(calculateAgeGroupsFromSubmissions(subs)).toEqual({ kids: 0, teenagers: 1, adults: 0 });
  });

  it('boundary: 12 is kid, 13 is teen, 17 is teen, 18 is adult', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geburtsdatum: '2012-06-15' } }), // exactly 12
      createPatient({ _id: '2', submissions: { geburtsdatum: '2011-06-14' } }), // 13
      createPatient({ _id: '3', submissions: { geburtsdatum: '2007-06-15' } }), // 17
      createPatient({ _id: '4', submissions: { geburtsdatum: '2006-06-15' } }), // 18
    ];
    const result = calculateAgeGroupsFromSubmissions(subs);
    expect(result).toEqual({ kids: 1, teenagers: 2, adults: 1 });
  });

  it('skips entries without birth date', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geburtsdatum: undefined } }),
    ];
    expect(calculateAgeGroupsFromSubmissions(subs)).toEqual({ kids: 0, teenagers: 0, adults: 0 });
  });

  it('skips invalid birth dates', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geburtsdatum: 'invalid' } }),
    ];
    expect(calculateAgeGroupsFromSubmissions(subs)).toEqual({ kids: 0, teenagers: 0, adults: 0 });
  });
});

describe('calculateGenderGroupsFromSubmissions', () => {
  it('counts men, women, and divers', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geschlecht: 'Männl' } }),
      createPatient({ _id: '2', submissions: { geschlecht: 'Weibl.' } }),
      createPatient({ _id: '3', submissions: { geschlecht: 'Divers' } }),
      createPatient({ _id: '4', submissions: { geschlecht: 'Männl' } }),
    ];
    expect(calculateGenderGroupsFromSubmissions(subs)).toEqual({ men: 2, women: 1, divers: 1 });
  });

  it('skips entries without gender', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geschlecht: undefined } }),
    ];
    expect(calculateGenderGroupsFromSubmissions(subs)).toEqual({ men: 0, women: 0, divers: 0 });
  });

  it('ignores unknown gender values', () => {
    const subs = [
      createPatient({ _id: '1', submissions: { geschlecht: 'Unknown' } }),
    ];
    expect(calculateGenderGroupsFromSubmissions(subs)).toEqual({ men: 0, women: 0, divers: 0 });
  });
});
