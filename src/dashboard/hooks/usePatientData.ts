
// ==============================================
// FIXED: 3. src/dashboard/pages/hooks/usePatientData.ts
// ==============================================

import { useState, useEffect } from 'react';
import { submissions } from '@wix/forms';
import { PatientSubmission, AgeGroups, GenderGroups } from '../types';

export const usePatientData = () => {
    const [allSubmissions, setAllSubmissions] = useState<PatientSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubmissions = async () => {
        setLoading(true);
        setError(null);

        try {
            let allData: PatientSubmission[] = [];
            let keepLoading = true;
            let lastItem: any = null; // Use any to avoid type issues

            while (keepLoading) {
                let query = submissions.querySubmissionsByNamespace()
                    .eq("namespace", "wix.form_app.form")
                    .descending("_createdDate")
                    .limit(100);

                if (lastItem) {
                    query = query.lt("_createdDate", lastItem._createdDate);
                }

                const results = await query.find();

                if (results.items.length > 0) {
                    // Type assertion to match our interface
                    const typedItems = results.items.map(item => ({
                        _id: item._id || '',
                        _createdDate: item._createdDate || '',
                        _updatedDate: item._updatedDate || '',
                        formId: item.formId || '',
                        namespace: item.namespace || '',
                        status: item.status || '',
                        revision: item.revision || '',
                        seen: item.seen || false,
                        submitter: item.submitter || {},
                        submissions: item.submissions || {}
                    })) as PatientSubmission[];

                    allData = [...allData, ...typedItems];
                    lastItem = results.items[results.items.length - 1];
                    keepLoading = results.items.length === 100 && allData.length < 300;
                } else {
                    keepLoading = false;
                }
            }

            setAllSubmissions(allData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const calculateAgeGroups = (submissions: PatientSubmission[]): AgeGroups => {
        const ageGroups = { kids: 0, teenagers: 0, adults: 0 };

        submissions.forEach(submission => {
            const birthDate = submission.submissions.geburtsdatum;
            if (!birthDate) return;

            const today = new Date();
            const birthDateObj = new Date(birthDate);
            if (isNaN(birthDateObj.getTime())) return;

            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }

            if (age <= 12) {
                ageGroups.kids++;
            } else if (age <= 18) {
                ageGroups.teenagers++;
            } else if (age <= 120) {
                ageGroups.adults++;
            }
        });

        return ageGroups;
    };

    const calculateGenderGroups = (submissions: PatientSubmission[]): GenderGroups => {
        const genderGroups = { men: 0, women: 0, divers: 0 };

        submissions.forEach(submission => {
            const gender = submission.submissions.geschlecht;
            if (!gender) return;

            switch (gender) {
                case "Männl":
                    genderGroups.men++;
                    break;
                case "Weibl.":
                    genderGroups.women++;
                    break;
                case "Divers":
                    genderGroups.divers++;
                    break;
            }
        });

        return genderGroups;
    };

    return {
        allSubmissions,
        loading,
        error,
        loadSubmissions,
        calculateAgeGroups,
        calculateGenderGroups,
    };
};
