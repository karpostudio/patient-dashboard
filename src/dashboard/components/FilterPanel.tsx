
// ==============================================
// FIXED: 6. src/dashboard/pages/components/FilterPanel.tsx
// ==============================================

import React from 'react';
import {
    Card,
    Dropdown,
    Checkbox,
    Button,
    Text,
    Box,
    TextButton
} from '@wix/design-system';
import { FilterState } from '../types';

interface FilterPanelProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: any) => void;
    onClearFilters: () => void;
}

function isAnyFilterActive(filters: FilterState): boolean {
    return !!(
        filters.selectedDay ||
        filters.selectedTimeSlots.length > 0 ||
        filters.selectedHomeVisit.length > 0 ||
        filters.selectedTreatment.length > 0 ||
        filters.selectedAgeGroups.length > 0 ||
        filters.showDuplicatesOnly ||
        (filters.searchTerm && filters.searchTerm.trim() !== '')
    );
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
}) => {
    const dayOptions = [
        { id: 'monday', value: 'Montag' },
        { id: 'tuesday', value: 'Dienstag' },
        { id: 'wednesday', value: 'Mittwoch' },
        { id: 'thursday', value: 'Donnerstag' },
        { id: 'friday', value: 'Freitag' },
    ];

    const timeSlotOptions = [
        { value: '8', label: '8-9' },
        { value: '9', label: '9-10' },
        { value: '10', label: '10-11' },
        { value: '11', label: '11-12' },
        { value: '12', label: '12-13' },
        { value: '13', label: '13-14' },
        { value: '14', label: '14-15' },
        { value: '15', label: '15-16' },
        { value: '16', label: '16-17' },
        { value: '17', label: '17-18' },
        { value: '18', label: '18-19' },
    ];

    const homeVisitOptions = [
        { value: 'Ja', label: 'Ja' },
        { value: 'Nein', label: 'Nein' },
    ];

    const treatmentOptions = [
        { value: 'Ja', label: 'Ja' },
        { value: 'Nein', label: 'Nein' },
    ];

    const ageGroupOptions = [
        { value: 'kind', label: 'Kinder (0-12)' },
        { value: 'teen', label: 'Jugendliche (13-17)' },
        { value: 'erwachsene', label: 'Erwachsene (18+)' },
    ];

    const handleTimeSlotChange = (value: string, checked: boolean) => {
        const currentSlots = filters.selectedTimeSlots;
        const newSlots = checked
            ? [...currentSlots, value]
            : currentSlots.filter(slot => slot !== value);
        onFilterChange('selectedTimeSlots', newSlots);
    };

    const handleHomeVisitChange = (value: string, checked: boolean) => {
        const currentValues = filters.selectedHomeVisit;
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(val => val !== value);
        onFilterChange('selectedHomeVisit', newValues);
    };

    const handleAgeGroupChange = (value: string, checked: boolean) => {
        const currentGroups = filters.selectedAgeGroups;
        const newGroups = checked
            ? [...currentGroups, value]
            : currentGroups.filter(group => group !== value);
        onFilterChange('selectedAgeGroups', newGroups);
    };

    const handleTreatmentChange = (value: string, checked: boolean) => {
        const currentValues = filters.selectedTreatment;
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(val => val !== value);
        onFilterChange('selectedTreatment', newValues);
    };

    return (
        <Card>
            <Card.Content>
                <Box direction="vertical" gap="SP2" paddingBottom="SP2" >
                    <Text weight="normal">Filterverfügbarkeit</Text>
                    {isAnyFilterActive(filters) && (
                        <TextButton
                            priority="tertiary"
                            size="small"
                            onClick={onClearFilters}
                        >
                            Alle Filter löschen
                        </TextButton>
                    )}
                </Box>

                <Box direction="vertical" gap="SP4">
                    <Box direction="vertical" gap="SP2">
                        <Text size="medium" >Tag</Text>
                        <Dropdown
                            placeholder="Wähle einen Tag"
                            options={dayOptions}
                            selectedId={filters.selectedDay || undefined}
                            onSelect={(option) => onFilterChange('selectedDay', option?.id || null)}
                        />
                    </Box>

                    <Box direction="vertical" gap="SP2">
                        <Text size="medium" >Zeitfenster</Text>
                        <Box direction="vertical" gap="SP1">
                            {timeSlotOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    checked={filters.selectedTimeSlots.includes(option.value)}
                                    onChange={(e) => handleTimeSlotChange(option.value, e.target.checked)}
                                >
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Box>
                    </Box>

                    <Box direction="vertical" gap="SP2">
                        <Text size="medium" >Hausbesuch</Text>
                        <Box direction="vertical" gap="SP1">
                            {homeVisitOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    checked={filters.selectedHomeVisit.includes(option.value)}
                                    onChange={(e) => handleHomeVisitChange(option.value, e.target.checked)}
                                >
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Box>
                    </Box>

                    <Box direction="vertical" gap="SP2">
                        <Text size="medium">Schon einmal in Behandlung</Text>
                        <Box direction="vertical" gap="SP1">
                            {treatmentOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    checked={filters.selectedTreatment.includes(option.value)}
                                    onChange={(e) => handleTreatmentChange(option.value, e.target.checked)}
                                >
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Box>
                    </Box>

                    <Box direction="vertical" gap="SP2">
                        <Text size="medium">Altersgruppe</Text>
                        <Box direction="vertical" gap="SP1">
                            {ageGroupOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    checked={filters.selectedAgeGroups.includes(option.value)}
                                    onChange={(e) => handleAgeGroupChange(option.value, e.target.checked)}
                                >
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Box>
                    </Box>

                    <Box direction="vertical" gap="SP2">
                        <Text size="medium">Erweiterte Optionen</Text>
                        <Box direction="vertical" gap="SP1">
                            <Checkbox
                                checked={filters.showDuplicatesOnly || false}
                                onChange={(e) => onFilterChange('showDuplicatesOnly', e.target.checked)}
                            >
                                Doppelte Einträge
                            </Checkbox>
                        </Box>
                    </Box>
                </Box>
            </Card.Content>
        </Card>
    );
};
