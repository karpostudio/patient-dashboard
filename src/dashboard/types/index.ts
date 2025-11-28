// ==============================================
// 1. src/dashboard/pages/types/index.ts
// ==============================================
export interface PatientSubmission {
    _id: string;
    _createdDate: string;
    _updatedDate?: string;
    formId: string;
    namespace: string;
    status: string;
    revision: string;
    seen?: boolean;
    submitter?: {
        applicationId?: string;
        memberId?: string;
        visitorId?: string;
        userId?: string;
    };
    submissions: {
        name_1?: string;
        vorname?: string;
        email_726a?: string;
        geburtsdatum?: string;
        geschlecht?: string;
        date_5bd8?: string;
        waren_sie_schon_einmal_bei_uns_in_behandlung?: string;
        wurde_ein_hausbesuch_verordnet?: string;
        form_field_ab01?: boolean;
        montag?: string[];
        dienstag?: string[];
        mittwoch?: string[];
        donnerstag?: string[];
        freitag?: string[];
        address_51bd?: string;
        telefon?: string;
        diagnose_oder_grund_ihrer_anmeldung?: string;
        verordnende_r_aerztin_arzt?: string;
        krankenkasse?: string;
        ab_mailbox_activ?: string;
        name_der_anmeldenden_person?: string;
        verhaeltnis?: string;
        bei_volljaehrigen_patienten_zuzahlungsbefreit?: string;
        wuerden_sie_auch_kurzfristige_termine_wahrnehmen_koennen_wenn_z?: string;
        noch_etwas_wichtiges?: string;
        signature_3730?: {
            url?: string;
            fileId?: string;
            displayName?: string;
            fileType?: string;
            imported?: boolean;
        }[];
    };
}

export interface FilterState {
    selectedDay: string | null;
    selectedTimeSlots: string[];
    selectedHomeVisit: string[];
    selectedAgeGroups: string[];
    selectedTreatment: string[];
    searchTerm: string;
    showDuplicatesOnly: boolean;
}

export interface AgeGroups {
    kids: number;
    teenagers: number;
    adults: number;
}

export interface GenderGroups {
    men: number;
    women: number;
    divers: number;
}

export interface WaitingTime {
    months: number;
    days: number;
}