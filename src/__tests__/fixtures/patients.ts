import { PatientSubmission } from '../../dashboard/types';

export function createPatient(overrides: Partial<PatientSubmission> = {}): PatientSubmission {
  return {
    _id: 'test-id-1',
    _createdDate: '2024-01-15T10:00:00.000Z',
    _updatedDate: '2024-01-15T10:00:00.000Z',
    formId: 'form-1',
    namespace: 'wix.form_app.form',
    status: 'CONFIRMED',
    revision: '1',
    seen: false,
    submitter: {},
    submissions: {
      name_1: 'Müller',
      vorname: 'Hans',
      email_726a: 'hans@example.com',
      geburtsdatum: '1990-05-15',
      geschlecht: 'Männl',
      date_5bd8: '2024-01-15',
      waren_sie_schon_einmal_bei_uns_in_behandlung: 'Nein',
      wurde_ein_hausbesuch_verordnet: 'Nein',
      form_field_ab01: false,
      montag: ['8-9', '9-10'],
      dienstag: [],
      mittwoch: ['14-15'],
      donnerstag: [],
      freitag: [],
      address_51bd: 'Musterstraße 1, 14612 Falkensee',
      telefon: '0331-1234567',
      diagnose_oder_grund_ihrer_anmeldung: 'Sprachentwicklungsverzögerung',
      krankenkasse: 'AOK',
      ...overrides.submissions,
    },
    ...overrides,
  };
}

export function createChild(overrides: Partial<PatientSubmission> = {}): PatientSubmission {
  return createPatient({
    _id: 'child-1',
    submissions: {
      name_1: 'Klein',
      vorname: 'Anna',
      geburtsdatum: '2018-03-20',
      geschlecht: 'Weibl.',
      ...overrides.submissions,
    },
    ...overrides,
  });
}

export function createTeen(overrides: Partial<PatientSubmission> = {}): PatientSubmission {
  return createPatient({
    _id: 'teen-1',
    submissions: {
      name_1: 'Jung',
      vorname: 'Max',
      geburtsdatum: '2010-06-10',
      geschlecht: 'Männl',
      ...overrides.submissions,
    },
    ...overrides,
  });
}

export function createAdult(overrides: Partial<PatientSubmission> = {}): PatientSubmission {
  return createPatient({
    _id: 'adult-1',
    submissions: {
      name_1: 'Alt',
      vorname: 'Petra',
      geburtsdatum: '1980-11-25',
      geschlecht: 'Weibl.',
      ...overrides.submissions,
    },
    ...overrides,
  });
}

export function createFlexiblePatient(overrides: Partial<PatientSubmission> = {}): PatientSubmission {
  return createPatient({
    _id: 'flexible-1',
    submissions: {
      name_1: 'Flex',
      vorname: 'Isa',
      form_field_ab01: true,
      ...overrides.submissions,
    },
    ...overrides,
  });
}

export function createSubmissionList(): PatientSubmission[] {
  return [
    createChild(),
    createTeen(),
    createAdult(),
    createFlexiblePatient(),
    createPatient({
      _id: 'dup-1',
      submissions: { name_1: 'Müller', vorname: 'Hans' },
    }),
  ];
}
