import React, { useState, useEffect } from 'react';
import {
    Modal,
    CustomModalLayout,
    Box,
    Input,
    FormField,
    Text,
    Layout,
    Cell,
    Dropdown,
    Button,
    TextButton,
    InputArea,
    Checkbox
} from '@wix/design-system';
import { dashboard } from '@wix/dashboard';
import { submissions } from '@wix/forms';
import { PatientSubmission } from '../types';

interface EditSubmissionModalProps {
    patient: PatientSubmission | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
    patient,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [originalData, setOriginalData] = useState<any>({});

    useEffect(() => {
        if (patient) {
            // Exclude signature field from form data since we're not editing it
            const { signature_3730, ...submissionsWithoutSignature } = patient.submissions;
            const data = { ...submissionsWithoutSignature };

            // Ensure availability data is properly formatted as arrays and convert to display format
            const availabilityFields = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag'];
            availabilityFields.forEach(field => {
                const fieldData = (data as any)[field];
                if (!Array.isArray(fieldData)) {
                    (data as any)[field] = fieldData ? [fieldData] : [];
                }
                // Convert stored format to display format
                (data as any)[field] = ((data as any)[field] as string[]).map(convertStoredToDisplay);
            });

            // If flexibility checkbox is true, pre-select all time slots
            if (data.form_field_ab01) {
                availabilityFields.forEach(field => {
                    (data as any)[field] = [...timeSlots];
                });
            }

            console.log('Loading patient data:', data);
            setFormData(data);
            setOriginalData(data);
        }
    }, [patient]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!patient) return;

        setIsLoading(true);
        try {
            console.log('=== DEBUG: Starting submission update with elevation ===');
            console.log('Patient object:', patient);
            console.log('Patient formId:', patient.formId);
            console.log('Patient revision:', patient.revision);
            console.log('Patient status:', patient.status);

            // Convert availability data back to stored format before saving
            const dataToSave = { ...formData };
            const availabilityFields = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag'];
            availabilityFields.forEach(field => {
                if (Array.isArray(dataToSave[field])) {
                    dataToSave[field] = dataToSave[field].map(convertDisplayToStored);
                }
            });

            console.log('Form data to save:', dataToSave);

            // Get the latest submission first (like in your working Velo code)
            console.log('Getting latest submission data...');
            const latestSubmission = await submissions.getSubmission(patient._id);
            console.log('Latest submission:', latestSubmission);

            // Ensure we have submissions data
            if (!latestSubmission.submissions) {
                throw new Error('Submission data is missing');
            }

            console.log('Original signature field:', latestSubmission.submissions.signature_3730);
            console.log('Full original submissions:', JSON.stringify(latestSubmission.submissions, null, 2));

            // Fix invalid signature fields by providing default values
            let signatureField = latestSubmission.submissions.signature_3730;

            if (signatureField && Array.isArray(signatureField) && signatureField.length > 0) {
                // Check if the signature has invalid/null values and fix them
                const sig = signatureField[0];

                // If url is null, undefined, or not a string, set it to a valid placeholder
                if (!sig.url || typeof sig.url !== 'string') {
                    console.log('Fixing null/invalid URL in signature');
                    signatureField = [{
                        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent PNG
                        fileId: sig.fileId || 'placeholder',
                        displayName: sig.displayName || 'signature',
                        fileType: sig.fileType || 'image/jpeg',
                        ...(sig.imported ? { imported: sig.imported } : {})
                    }];
                }
            } else if (!signatureField || (Array.isArray(signatureField) && signatureField.length === 0)) {
                // No signature or empty array - create valid placeholder signature
                console.log('Creating default placeholder signature structure');
                signatureField = [{
                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent PNG
                    fileId: 'placeholder',
                    displayName: 'signature',
                    fileType: 'image/png'
                }];
            }

            console.log('Fixed signature field:', signatureField);

            // Create update payload following your working Velo pattern
            const updatePayload = {
                formId: latestSubmission.formId,
                revision: latestSubmission.revision,
                namespace: "wix.form_app.form",
                submissions: {
                    ...latestSubmission.submissions,
                    ...dataToSave,
                    signature_3730: signatureField // Always include the fixed signature
                }
            };

            console.log('Final update payload with fixed signature:', JSON.stringify(updatePayload.submissions.signature_3730, null, 2));

            // Update the submission using the same method as your working code
            const updatedSubmission = await submissions.updateSubmission(patient._id, updatePayload);

            console.log('Update result:', updatedSubmission);

            dashboard.showToast({
                message: 'Einreichung erfolgreich aktualisiert',
                type: 'success',
            });

            onSave(); // Refresh the data
            onClose();
        } catch (error) {
            console.error('=== DEBUG: Error updating submission ===');
            console.error('Error details:', error);
            console.error('Patient object at time of error:', patient);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            dashboard.showToast({
                message: `Fehler beim Aktualisieren der Einreichung: ${errorMessage}`,
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscard = () => {
        setFormData(originalData);
        onClose();
    };

    // Time slots for availability
    const timeSlots = [
        '08-09', '09-10', '10-11', '11-12',
        '12-13', '13-14', '14-15', '15-16',
        '16-17', '17-18'
    ];

    // Helper function to convert stored format to display format
    const convertStoredToDisplay = (storedFormat: string): string => {
        // Convert '8-9' to '08-09'
        const [start, end] = storedFormat.split('-');
        const startPadded = start.padStart(2, '0');
        const endPadded = end.padStart(2, '0');
        return `${startPadded}-${endPadded}`;
    };

    // Helper function to convert display format to stored format
    const convertDisplayToStored = (displayFormat: string): string => {
        // Convert '08-09' to '8-9'
        const [start, end] = displayFormat.split('-');
        const startHour = parseInt(start);
        const endHour = parseInt(end);
        return `${startHour}-${endHour}`;
    };

    // Helper function to render time slot grid for a day
    const renderTimeSlotGrid = (dayField: string, dayLabel: string) => {
        const selectedSlots = Array.isArray(formData[dayField]) ? formData[dayField] : [];

        console.log(`${dayLabel} selected slots:`, selectedSlots);

        const toggleTimeSlot = (timeSlot: string) => {
            const isSelected = selectedSlots.includes(timeSlot);
            let newSelectedSlots;

            if (isSelected) {
                newSelectedSlots = selectedSlots.filter((slot: string) => slot !== timeSlot);
            } else {
                newSelectedSlots = [...selectedSlots, timeSlot];
            }

            console.log(`Updating ${dayLabel} slots:`, newSelectedSlots);
            handleInputChange(dayField, newSelectedSlots);
        };

        const selectAllTimeSlots = () => {
            handleInputChange(dayField, [...timeSlots]);
        };

        return (
            <Cell span={12} key={dayField}>
                <Box direction="horizontal" align="space-between" verticalAlign="middle">
                    <FormField label={dayLabel} labelSize="small" />
                    <TextButton
                        size="small"
                        onClick={selectAllTimeSlots}
                        disabled={selectedSlots.length === timeSlots.length}
                    >
                        Alle auswählen
                    </TextButton>
                </Box>
                <Box marginTop="SP1">
                    <Box
                        direction="horizontal"
                        gap="SP1"
                        style={{ flexWrap: 'wrap' }}
                    >
                        {timeSlots.map((timeSlot) => {
                            const isSelected = selectedSlots.includes(timeSlot);
                            console.log(`${timeSlot} in ${dayLabel}: selected=${isSelected}, selectedSlots=`, selectedSlots);

                            return (
                                <Button
                                    key={timeSlot}
                                    size="small"
                                    skin={isSelected ? 'standard' : 'light'}
                                    priority={isSelected ? 'primary' : 'secondary'}
                                    onClick={() => toggleTimeSlot(timeSlot)}
                                    style={{
                                        minWidth: '70px',
                                        margin: '1px',
                                        backgroundColor: isSelected ? '#326bf6' : 'transparent',
                                        color: isSelected ? 'white' : '#162D3D',
                                        border: `1px solid ${isSelected ? '#326bf6' : '#B3B9C0'}`,
                                        borderRadius: '8px',
                                        height: '36px'
                                    }}
                                >
                                    {timeSlot}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>
            </Cell>
        );
    };

    if (!patient) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={true}
            screen="desktop"
        >
            <CustomModalLayout
                title="Einreichung bearbeiten"
                subtitle={`Bearbeiten Sie die Daten für ${formData.vorname || ''} ${formData.name_1 || ''}`.trim()}
                primaryButtonText={isLoading ? "Speichern..." : "Speichern"}
                secondaryButtonText="Verwerfen"
                primaryButtonOnClick={handleSave}
                secondaryButtonOnClick={handleDiscard}
                onCloseButtonClick={onClose}
                primaryButtonProps={{ disabled: isLoading }}
                width="865px"
                content={
                    <Box direction="vertical" gap="SP4">
                        <Layout>
                            {/* Personal Information */}
                            <Cell span={12}>
                                <Text size="medium" weight="bold">Persönliche Daten</Text>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Vorname">
                                    <Input
                                        value={formData.vorname || ''}
                                        onChange={(e) => handleInputChange('vorname', e.target.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Nachname">
                                    <Input
                                        value={formData.name_1 || ''}
                                        onChange={(e) => handleInputChange('name_1', e.target.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="E-Mail">
                                    <Input
                                        value={formData.email_726a || ''}
                                        onChange={(e) => handleInputChange('email_726a', e.target.value)}
                                        type="email"
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Telefonnummer">
                                    <Input
                                        value={formData.telefon || ''}
                                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                                        type="tel"
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Geburtsdatum">
                                    <Input
                                        value={formData.geburtsdatum || ''}
                                        onChange={(e) => handleInputChange('geburtsdatum', e.target.value)}
                                        type="date"
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Geschlecht">
                                    <Dropdown
                                        placeholder="Geschlecht wählen"
                                        options={[
                                            { id: 'Männl', value: 'Männl' },
                                            { id: 'Weibl.', value: 'Weibl.' },
                                            { id: 'Divers', value: 'Divers' }
                                        ]}
                                        selectedId={formData.geschlecht || ''}
                                        onSelect={(option) => handleInputChange('geschlecht', option.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Krankenkasse">
                                    <Input
                                        value={formData.krankenkasse || ''}
                                        onChange={(e) => handleInputChange('krankenkasse', e.target.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Name der anmeldenden Person">
                                    <Input
                                        value={formData.name_der_anmeldenden_person || ''}
                                        onChange={(e) => handleInputChange('name_der_anmeldenden_person', e.target.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Adresse">
                                    <Input
                                        value={formData.address_51bd || ''}
                                        onChange={(e) => handleInputChange('address_51bd', e.target.value)}
                                    />
                                </FormField>
                            </Cell>

                            {/* Medical Information */}
                            <Cell span={12}>
                                <Text size="medium" weight="bold">Medizinische Informationen</Text>
                            </Cell>

                            <Cell span={12}>
                                <FormField label="Diagnose oder Grund der Anmeldung">
                                    <InputArea
                                        value={formData.diagnose_oder_grund_ihrer_anmeldung || ''}
                                        onChange={(e) => handleInputChange('diagnose_oder_grund_ihrer_anmeldung', e.target.value)}
                                        rows={4}
                                        resizable
                                        ariaLabel="Diagnose oder Grund der Anmeldung"
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Hausbesuch verordnet">
                                    <Dropdown
                                        placeholder="Wählen"
                                        options={[
                                            { id: 'Ja', value: 'Ja' },
                                            { id: 'Nein', value: 'Nein' }
                                        ]}
                                        selectedId={formData.wurde_ein_hausbesuch_verordnet || ''}
                                        onSelect={(option) => handleInputChange('wurde_ein_hausbesuch_verordnet', option.value)}
                                    />
                                </FormField>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Schon einmal in Behandlung">
                                    <Dropdown
                                        placeholder="Wählen"
                                        options={[
                                            { id: 'Ja', value: 'Ja' },
                                            { id: 'Nein', value: 'Nein' }
                                        ]}
                                        selectedId={formData.waren_sie_schon_einmal_bei_uns_in_behandlung || ''}
                                        onSelect={(option) => handleInputChange('waren_sie_schon_einmal_bei_uns_in_behandlung', option.value)}
                                    />
                                </FormField>
                            </Cell>

                            {/* Flexibility Option */}
                            <Cell span={12}>
                                <FormField label="Flexibilität">
                                    <Checkbox
                                        checked={formData.form_field_ab01 || false}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            handleInputChange('form_field_ab01', isChecked);

                                            // If checked, select all time slots for all days
                                            if (isChecked) {
                                                const availabilityFields = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag'];
                                                availabilityFields.forEach(field => {
                                                    handleInputChange(field, [...timeSlots]);
                                                });
                                            } else {
                                                // If unchecked, clear all time slots
                                                const availabilityFields = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag'];
                                                availabilityFields.forEach(field => {
                                                    handleInputChange(field, []);
                                                });
                                            }
                                        }}
                                    >
                                        Ich bin flexibel und kann jederzeit
                                    </Checkbox>
                                </FormField>
                            </Cell>

                            {/* Availability Slots */}
                            <Cell span={12}>
                                <Text size="medium" weight="bold">Verfügbarkeitszeiten</Text>
                            </Cell>

                            {renderTimeSlotGrid('montag', 'Montag')}
                            {renderTimeSlotGrid('dienstag', 'Dienstag')}
                            {renderTimeSlotGrid('mittwoch', 'Mittwoch')}
                            {renderTimeSlotGrid('donnerstag', 'Donnerstag')}
                            {renderTimeSlotGrid('freitag', 'Freitag')}

                            {/* Date Information */}
                            <Cell span={12}>
                                <Text size="medium" weight="bold">Datum</Text>
                            </Cell>

                            <Cell span={6}>
                                <FormField label="Das heutige Datum">
                                    <Input
                                        value={formData.date_5bd8 || ''}
                                        onChange={(e) => handleInputChange('date_5bd8', e.target.value)}
                                        type="date"
                                    />
                                </FormField>
                            </Cell>

                            {/* Add extra spacing below the date field */}
                            <Cell span={12}>
                                <Box marginBottom="SP4" />
                            </Cell>
                        </Layout>
                    </Box>
                }
            />
        </Modal>
    );
};