import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Heading,
    Text,
    Button,
    IconButton
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { PatientSubmission } from '../types';
import { useNotes } from '../hooks/useNotes';
import { getSignatureDownloadUrl } from '../../backend/forms.web';

interface PatientDetailsModalProps {
    patient: PatientSubmission | null;
    isOpen: boolean;
    onClose: () => void;
    onPrint: (patient: PatientSubmission, signatureUrl?: string | null) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
    patient,
    isOpen,
    onClose,
    onPrint
}) => {
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [signatureLoading, setSignatureLoading] = useState(false);
    const [signatureFailed, setSignatureFailed] = useState(false);

    // Load signature using download URL for private files
    useEffect(() => {
        let isMounted = true;

        const loadSignature = async () => {
            if (!patient) {
                setSignatureUrl(null);
                setSignatureFailed(false);
                return;
            }

            // Get signature object from submission
            const sig = patient.submissions.signature_3730;
            if (!sig || (Array.isArray(sig) && sig.length === 0)) {
                setSignatureUrl(null);
                setSignatureFailed(false);
                return;
            }

            const signatureObj = Array.isArray(sig) ? sig[0] : sig;

            // Need fileId to generate download URL
            if (!signatureObj?.fileId) {
                setSignatureUrl(null);
                setSignatureFailed(false);
                return;
            }

            if (isMounted) {
                setSignatureLoading(true);
                setSignatureFailed(false);
            }

            try {
                // Get temporary download URL for private file
                const result = await getSignatureDownloadUrl(signatureObj.fileId);

                if (isMounted) {
                    if (result.success && result.downloadUrl) {
                        setSignatureUrl(result.downloadUrl);
                    } else {
                        setSignatureFailed(true);
                    }
                    setSignatureLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    setSignatureFailed(true);
                    setSignatureLoading(false);
                }
            }
        };

        loadSignature();

        return () => {
            isMounted = false;
        };
    }, [patient]);

    // Handle image load failure
    const handleImageError = () => {
        setSignatureFailed(true);
        setSignatureUrl(null);
    };

    if (!patient) return null;

    const formatToGermanDate = (dateString: string) => {
        if (!dateString) return "Ungültiges Datum";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Ungültiges Datum";

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    };

    const renderAvailabilityGrid = () => {
        const days = [
            { name: 'Montag', data: patient.submissions.montag || [] },
            { name: 'Dienstag', data: patient.submissions.dienstag || [] },
            { name: 'Mittwoch', data: patient.submissions.mittwoch || [] },
            { name: 'Donnerstag', data: patient.submissions.donnerstag || [] },
            { name: 'Freitag', data: patient.submissions.freitag || [] }
        ];

        const timeSlots = ['08-09', '09-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19'];

        return (
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                border: '1px solid #ddd'
            }}>
                <thead>
                    <tr>
                        <th style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: '#f8f9fa',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: '12px'
                        }}>
                            Tag/Zeit
                        </th>
                        {timeSlots.map(slot => (
                            <th key={slot} style={{
                                padding: '6px 4px',
                                border: '1px solid #ddd',
                                backgroundColor: '#f8f9fa',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                fontSize: '12px',
                            }}>
                                {slot}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map(day => (
                        <tr key={day.name}>
                            <td style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                                backgroundColor: '#f8f9fa',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                            }}>
                                {day.name}
                            </td>
                            {timeSlots.map(timeSlot => (
                                <td key={`${day.name}-${timeSlot}`} style={{
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    backgroundColor: 'white',
                                    textAlign: 'center',
                                    fontSize: '12px'
                                }}>
                                    {patient.submissions.form_field_ab01 ? 'X' :
                                        day.data.some(slot => {
                                            // Check for exact match or variations without leading zeros
                                            const normalizedSlot = slot.trim();
                                            const normalizedTimeSlot = timeSlot.replace(/^0+/, '').replace('-0', '-');
                                            return normalizedSlot.includes(timeSlot) ||
                                                normalizedSlot.includes(normalizedTimeSlot) ||
                                                normalizedSlot === timeSlot ||
                                                normalizedSlot === normalizedTimeSlot;
                                        }) ? 'X' : ''
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={true}
            shouldDisplayCloseButton={true}
            contentLabel={`Patientendetails - ${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}`.trim()}
        >
            <Box
                direction="vertical"
                style={{ justifyContent: "space-between" }}
                align="center"
                gap="SP2"
            >
                {/* Top Bar with Print Button */}
                <Box
                    direction="vertical"
                    style={{ justifyContent: "space-between" }}
                    align="center"
                >
                    <Box direction="horizontal" gap="SP2" >
                        <Button
                            size="medium"
                            prefixIcon={<Icons.Print />}
                            onClick={() => onPrint(patient, signatureUrl)}
                        >
                            Drucken
                        </Button>
                    </Box>
                </Box>
                <Box
                    height="calc(100vh - 100px)"
                    backgroundColor="#f0f0f0"
                    maxWidth="1100px"
                    borderRadius="8px"
                    direction="vertical"
                    padding="SP4"
                >
                    {/* Scrollable Content Area */}
                    <Box
                        direction="vertical"

                        style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '20px',
                            maxWidth: '900px',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* A4 Card */}
                        <Box
                            className="modal-content"
                            style={{
                                width: '100%',
                                maxWidth: '800px',
                                minHeight: 'auto',
                                backgroundColor: 'white',
                                padding: '30px',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '12px',
                                lineHeight: '1.4',
                                marginTop: '20px',
                                marginBottom: '40px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                boxSizing: 'border-box'
                            }}
                            direction="vertical"
                            padding="SP4"
                        >
                            {/* Header Image */}
                            <Box align="center" marginBottom="SP6">
                                <img
                                    src="https://static.wixstatic.com/media/061196_bcdbd8aeed994cc29b8850c78bd7c14e~mv2.jpg"
                                    alt="Header"
                                    style={{ width: '460px', height: 'auto', maxWidth: '100%' }}
                                />
                            </Box>

                            {/* Title */}
                            <Heading align="center" size="medium" style={{ marginBottom: '20px' }}>
                                Anmeldung
                            </Heading>

                            {/* Patient Information Table */}
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginBottom: '30px',
                                marginTop: '20px',
                                fontSize: '12px'
                            }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa',
                                            width: '25%'
                                        }}>
                                            Name, Vorname
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            width: '75%'
                                        }} colSpan={3}>
                                            {`${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}`.trim()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Geschlecht
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.geschlecht || ''}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Geburtsdatum
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.geburtsdatum
                                                ? formatToGermanDate(patient.submissions.geburtsdatum)
                                                : 'Kein Geburtsdatum'
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Adresse
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }} colSpan={3}>
                                            {patient.submissions.address_51bd || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Telefon
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.telefon || ''}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            AB/Mailbox aktiv?
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.ab_mailbox_activ || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Email
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }} colSpan={3}>
                                            {patient.submissions.email_726a || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Name der anmeldenden Person
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.name_der_anmeldenden_person || ''}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Verhältnis
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.verhaeltnis || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Hausbesuch verordnet?
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.wurde_ein_hausbesuch_verordnet || ''}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Zuzahlungsbefreit?
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.bei_volljaehrigen_patienten_zuzahlungsbefreit || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa',
                                            verticalAlign: 'top'
                                        }}>
                                            Diagnose oder Grund Ihrer Anmeldung
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            minHeight: '60px',
                                            verticalAlign: 'top'
                                        }} colSpan={3}>
                                            {patient.submissions.diagnose_oder_grund_ihrer_anmeldung || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Verordnende/r Ärztin/Arzt
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.verordnende_r_aerztin_arzt || ''}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Krankenkasse
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {patient.submissions.krankenkasse || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Schon einmal bei uns in Behandlung?
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }} colSpan={3}>
                                            {patient.submissions.waren_sie_schon_einmal_bei_uns_in_behandlung || ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Availability Section */}
                            <Heading align="center" size="medium" style={{ marginBottom: '20px' }}>
                                Verfügbarkeit
                            </Heading>

                            <Box marginBottom="SP6" marginTop="20px">
                                {renderAvailabilityGrid()}
                            </Box>

                            {/* Additional Information */}
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px'
                            }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa',
                                            width: '25%'
                                        }}>
                                            Kurzfristige Termine
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }} colSpan={3}>
                                            {patient.submissions.wuerden_sie_auch_kurzfristige_termine_wahrnehmen_koennen_wenn_z || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa',
                                            verticalAlign: 'top'
                                        }}>
                                            Etwas Wichtiges?
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            minHeight: '60px',
                                            verticalAlign: 'top'
                                        }} colSpan={3}>
                                            {patient.submissions.noch_etwas_wichtiges || ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Datum
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {formatToGermanDate(patient.submissions.date_5bd8 || patient._createdDate)}
                                        </td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            Unterschrift
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {signatureLoading ? (
                                                <Text size="small">Laden...</Text>
                                            ) : signatureFailed ? (
                                                <Text size="small" skin="disabled">Nicht verfügbar</Text>
                                            ) : signatureUrl ? (
                                                <img
                                                    src={signatureUrl}
                                                    alt="Unterschrift"
                                                    style={{ maxWidth: '100px', maxHeight: '50px' }}
                                                    onError={handleImageError}
                                                />
                                            ) : null}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};