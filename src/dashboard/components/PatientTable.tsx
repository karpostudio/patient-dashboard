// ==============================================
// FIXED: PatientTable.tsx - Corrected Pagination Props
// ==============================================

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Text,
    Avatar,
    Badge,
    Pagination,
    PopoverMenu,
    Box,
    Search,
    Card,
    TableToolbar,
    TableActionCell,
    Input,
    IconButton,
    TableListHeader,
    TextButton
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { PatientSubmission } from '../types';
import { formatToGermanDate, calculateAge } from '../utils/helpers';
import { useNotes } from '../hooks/useNotes';
import { useLabels } from '../hooks/useLabels';
import { LabelSelectionModal } from './LabelSelectionModal';



interface PatientTableProps {
    patients: PatientSubmission[];
    onViewPatient: (patient: PatientSubmission) => void;
    onPrintPatient: (patient: PatientSubmission) => void;
    onDeletePatient: (patientId: string) => void;
    onEditPatient: (patient: PatientSubmission) => void;
    onUpdatePatientStatus: (patientId: string, status: string) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    totalPatients: number;
    onRefreshData?: () => Promise<void>;
}

const ITEMS_PER_PAGE = 40;

export const PatientTable: React.FC<PatientTableProps> = ({
    patients,
    onViewPatient,
    onPrintPatient,
    onDeletePatient,
    onEditPatient,
    onUpdatePatientStatus,
    searchTerm,
    onSearchChange,
    totalPatients,
    onRefreshData,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [editingNotes, setEditingNotes] = useState<{ [submissionId: string]: boolean }>({});
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [selectedPatientForLabels, setSelectedPatientForLabels] = useState<PatientSubmission | null>(null);


    // Use the notes hook
    const { notes, loadingNotes, loadNoteForSubmission, saveNote, updateNoteText } = useNotes();

    // Use the labels hook for email-based label inheritance
    const { emailLabels, loadBatchLabelsByEmails, loadLabelsByEmail } = useLabels();


    // Filter patients based on search term
    const filteredPatients = patients.filter(patient => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}`.toLowerCase();
        return fullName.includes(searchLower);
    });

    const [isChangingPage, setIsChangingPage] = useState(false);

    // Reset to first page when patients data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [patients.length]);

    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredPatients.length);

    // Sort patients
    const sortedPatients = [...filteredPatients].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'name':
                aValue = `${a.submissions.name_1 || ''} ${a.submissions.vorname || ''}`.trim();
                bValue = `${b.submissions.name_1 || ''} ${b.submissions.vorname || ''}`.trim();
                break;
            case 'date':
                aValue = a.submissions.date_5bd8 || a._createdDate;
                bValue = b.submissions.date_5bd8 || b._createdDate;
                break;
            case 'age':
                aValue = a.submissions.geburtsdatum || '';
                bValue = b.submissions.geburtsdatum || '';
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const currentPatients = sortedPatients.slice(startIndex, endIndex);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Handle sort change from TableListHeader
    const handleSortChange = (colNum: number) => {
        // Only column 1 (Date) is sortable
        if (colNum === 1) {
            handleSort('date');
        }
    };

    const headerOptions = [
        {
            value: '\u00A0\u00A0\u00A0\u00A0Name',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
        {
            value: `Datum (${sortField === 'date' && sortOrder === 'desc' ? 'Neueste' : 'Älteste'})`,
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
            sortable: true,
            sortDescending: sortField === 'date' ? sortOrder === 'desc' : undefined,
        },
        {
            value: 'Alter',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
        {
            value: 'Ort',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
        {
            value: 'WV',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
        {
            value: 'K/E',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
        {
            value: '',
            width: 'auto', // Let CSS handle the width
            align: 'left' as const,
        },
    ];

    // Load notes for visible patients
    useEffect(() => {
        if (currentPatients.length > 0) {
            currentPatients.forEach(patient => {
                const email = patient.submissions.email_726a?.trim() || '';
                const name = `${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim();
                loadNoteForSubmission(patient._id, email, name);
            });
        }
    }, [currentPatients, loadNoteForSubmission]);

    // Load email-based labels for visible patients in batch (from Labels collection)
    useEffect(() => {
        if (currentPatients.length > 0) {
            const emails = currentPatients
                .map(patient => patient.submissions.email_726a?.trim() || '')
                .filter(email => email !== '');

            if (emails.length > 0) {
                loadBatchLabelsByEmails(emails);
            }
        }
    }, [currentPatients, loadBatchLabelsByEmails]);


    const hasNoPatients = patients.length === 0;

    return (
        <Box direction="vertical" gap="SP4">
            {/* Integrated Table with Toolbar */}
            <Box
                style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'auto',
                    minWidth: '100%',
                    minHeight: hasNoPatients ? '100px' : 'auto'
                }}
            >

                <style>{`
    .patient-table-container table tbody tr {
        transition: background-color 0.15s ease;
    }
    .patient-table-container table tbody tr:hover {
        background-color: rgba(59, 130, 246, 0.08) !important;
    }
    .patient-table-container table tbody tr:hover td {
        background-color: transparent !important;
    }
    
    .table-row-hover:hover {
        background-color: rgba(59, 130, 246, 0.08) !important;
    }
    
    /* Horizontal scroll styling */
    .table-container {
        overflow-x: auto;
        min-width: 100%;
    }
    
    /* Ensure table has a minimum width */
    table { min-width: 1000px !important; }
    
    /* Custom scrollbar styling */
    .table-container::-webkit-scrollbar {
        height: 8px;
    }
    
    .table-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    .table-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    .table-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }

    .note-input-container {
        width: calc(100% - 36px);
        min-width: 200px;
    }
  
    /* Make actions column sticky */
    .actions-column {
        position: sticky !important;
        right: 20px !important;

        z-index: 1 !important;
    }
    
    /* Ensure sticky header works with horizontal scroll */
    [data-hook="table-list-header"] {
        position: sticky;
        top: 0;
        z-index: 2;
        background: white;
    }

    /* Add this to your existing styles */
    .modal-content table {
        max-width: 100% !important;
        table-layout: fixed;
        word-wrap: break-word;
    }

    .modal-content td {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .custom-grey-text {
        color: #888888 !important;
    }

    /* Label styling */
    .patient-label {
        display: inline-block;
        padding: 2px 6px;
        margin: 1px 2px 1px 0;
        background-color: #E3F2FD;
        border: 1px solid #BBDEFB;
        border-radius: 4px;
        font-size: 10px;
        line-height: 1.2;
        color: #1976D2;
        white-space: nowrap;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .patient-labels-container {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        margin-top: 4px;
        max-width: 200px;
    }
  
`}</style>
                <Card>
                    <TableToolbar>
                        <TableToolbar.ItemGroup position="start">
                            <TableToolbar.Item>
                                <Text size="medium" weight="normal">
                                    {filteredPatients.length !== totalPatients
                                        ? `${filteredPatients.length} von ${totalPatients} Patienten`
                                        : `${totalPatients} Patienten`
                                    }
                                </Text>
                            </TableToolbar.Item>
                            {/* {searchTerm && (
                                <TableToolbar.Item>
                                    <TableToolbar.Label>
                                        Gefiltert nach: "{searchTerm}"
                                    </TableToolbar.Label>
                                </TableToolbar.Item>
                            )} */}
                        </TableToolbar.ItemGroup>
                        <TableToolbar.ItemGroup position="end">
                            <TableToolbar.Item>
                                <Box width="300">
                                    <Search
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder="Nach Namen suchen..."
                                        size="small"
                                    />
                                </Box>
                            </TableToolbar.Item>
                        </TableToolbar.ItemGroup>
                    </TableToolbar>



                    {/* Custom table structure with expandable note rows */}
                    <Box
                        direction="vertical"
                        style={{
                            overflowX: 'auto',
                            minWidth: '900px' // Updated minimum width for responsive columns
                        }}
                    >
                        {/* Custom Table Header to match data row structure exactly */}
                        <Box
                            direction="horizontal"
                            padding="8px 16px"

                            backgroundColor="#d9e5fc"
                            style={{
                                alignItems: 'center',
                                borderTop: '1px solid #afc9fa',
                                borderBottom: '1px solid #afc9fa',
                                minWidth: '800px',
                                gap: '16px'
                            }}
                        >
                            {/* Name Column Header - matches exact structure of data row */}
                            <Box
                                minWidth="170px"
                                style={{
                                    minWidth: '222px',
                                    flex: '1 1 35%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Box width="24px" height="24px" flexShrink={0}>
                                    {/* Space for avatar - exact same size as Avatar */}
                                </Box>
                                <Text size="small" weight="normal" color="#1976D2">Name</Text>
                            </Box>

                            {/* Date Column Header */}
                            <div
                                style={{
                                    minWidth: '130px',
                                    flex: '1 1 18%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSort('date')}
                            >
                                <Text
                                    size="small"
                                    weight="normal"
                                    color="#1976D2"
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    Datum ({sortField === 'date' && sortOrder === 'desc' ? 'Neueste' : 'Älteste'})
                                    {sortField === 'date' && (
                                        <span style={{
                                            marginLeft: '4px',
                                            color: '#1976D2',
                                            fontWeight: 'bold'
                                        }}>
                                            {sortOrder === 'desc' ? '↓' : '↑'}
                                        </span>
                                    )}
                                </Text>
                            </div>

                            {/* Age Column Header */}
                            <Box
                                minWidth="100px"
                                style={{
                                    minWidth: '120px',
                                    flex: '1 1 15%',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Text size="small" weight="normal" color="#1976D2">Alter</Text>
                            </Box>

                            {/* Ort Column Header */}
                            <Box
                                style={{
                                    minWidth: '90px',
                                    flex: '1 1 12%',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <Text align="left" size="small" weight="normal" color="#1976D2">Ort</Text>
                            </Box>

                            {/* WV Column Header */}
                            <Box
                                style={{
                                    minWidth: '90px',
                                    flex: '1 1 12%',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Text align="left" size="small" weight="normal" color="#1976D2">WV</Text>
                            </Box>

                            {/* K/E Column Header */}
                            <Box
                                minWidth="120px"
                                style={{
                                    minWidth: '90px',
                                    flex: '1 1 12%',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Text align="left" size="small" weight="normal" color="#1976D2">K/E</Text>
                            </Box>

                            {/* Actions Column Header */}
                            <Box
                                style={{
                                    minWidth: '90px',
                                    flex: '1 1 10%',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Text size="small" weight="normal"></Text>
                            </Box>
                        </Box>

                        {hasNoPatients && (
                            <Box
                                width="100%"
                                padding="20px"
                                textAlign="center"
                                borderTop="1px solid #e0e0e0"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '150px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <Text size="medium" weight="normal">Keine Patienten gefunden</Text>
                            </Box>
                        )}

                        {/* Table Rows */}
                        <Box direction="vertical">
                            {currentPatients.map((patient, index) => {
                                const note = notes[patient._id];

                                const hasNote = note && note.notes && note.notes.trim() !== '';

                                // Calculate age
                                let age = 0;
                                if (patient.submissions.geburtsdatum) {
                                    const today = new Date();
                                    const birth = new Date(patient.submissions.geburtsdatum);
                                    age = today.getFullYear() - birth.getFullYear();
                                    const monthDiff = today.getMonth() - birth.getMonth();
                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                        age--;
                                    }
                                }

                                return (
                                    <Box key={patient._id} direction="vertical">
                                        {/* Main Patient Row */}
                                        <div
                                            onClick={() => onViewPatient(patient)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Box
                                                padding="16px"
                                                backgroundColor="#FFFFFF"
                                                style={{
                                                    alignItems: 'center',
                                                    minHeight: '56px',
                                                    transition: 'background-color 0.15s ease',
                                                    borderBottom: (note?.notes && note.notes.trim() !== '') ? 'none' : '1px solid #EAEAEA',
                                                    display: 'flex',
                                                    gap: '16px'
                                                }}
                                                className="table-row-hover"
                                            >
                                                {/* Name Column */}
                                                <Box
                                                    minWidth="170px"
                                                    style={{
                                                        flex: '1 1 35%',
                                                        minWidth: '224px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <Box minWidth="24px" minHeight="24px" style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Avatar size="size24" />
                                                    </Box>
                                                    <Box direction="vertical" gap="SP0">
                                                        <Text size="small">
                                                            {`${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim()}
                                                        </Text>
                                                        {patient.submissions.name_der_anmeldenden_person &&
                                                            patient.submissions.name_der_anmeldenden_person.trim() !== `${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}`.trim() && (
                                                                <Text size="tiny" className="custom-grey-text">
                                                                    {patient.submissions.name_der_anmeldenden_person}
                                                                </Text>
                                                            )}

                                                        {/* Display email-based labels (from Labels collection) */}
                                                        {(() => {
                                                            const email = patient.submissions.email_726a?.trim() || '';
                                                            const emailBasedLabels = email ? emailLabels[email] : [];

                                                            if (emailBasedLabels && emailBasedLabels.length > 0) {
                                                                return (
                                                                    <Box direction="horizontal" gap="SP1" style={{ marginTop: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                                                                        {emailBasedLabels.map((label, labelIndex) => (
                                                                            <Badge
                                                                                key={labelIndex}
                                                                                skin="general"
                                                                                size="tiny"
                                                                            >
                                                                                {label}
                                                                            </Badge>
                                                                        ))}
                                                                    </Box>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </Box>
                                                </Box>

                                                {/* Date Column */}
                                                <Box minWidth="130px" style={{ minWidth: '120px', flex: '1 1 18%' }}>
                                                    <Text size="small">
                                                        {formatToGermanDate(patient.submissions.date_5bd8 || patient._createdDate)}
                                                    </Text>
                                                </Box>

                                                {/* Age Column */}
                                                <Box minWidth="100px" style={{ minWidth: '120px', flex: '1 1 15%' }}>
                                                    <Text size="small" style={{ whiteSpace: 'nowrap' }}>
                                                        {patient.submissions.geburtsdatum
                                                            ? calculateAge(patient.submissions.geburtsdatum)
                                                            : 'Kein Geburtsdatum'
                                                        }
                                                    </Text>
                                                </Box>

                                                {/* HB Column */}
                                                <Box align="left" style={{ minWidth: '90px', flex: '1 1 12%' }}>
                                                    <Badge
                                                        skin={patient.submissions.wurde_ein_hausbesuch_verordnet === 'Ja' ? 'success' : 'neutralLight'}
                                                        size="small"
                                                    >
                                                        {patient.submissions.wurde_ein_hausbesuch_verordnet === 'Ja' ? 'HAUS' : 'PRAXIS'}
                                                    </Badge>
                                                </Box>

                                                {/* WV Column */}
                                                <Box align="left" style={{ minWidth: '90px', flex: '1 1 12%' }}>
                                                    <Badge
                                                        skin={patient.submissions.waren_sie_schon_einmal_bei_uns_in_behandlung === 'Nein' ? 'neutralLight' : 'success'}
                                                        size="small"
                                                    >
                                                        {patient.submissions.waren_sie_schon_einmal_bei_uns_in_behandlung === 'Nein' ? 'NA' : 'WV'}
                                                    </Badge>
                                                </Box>

                                                {/* K/E Column */}
                                                <Box minWidth="120px" align="left" style={{ minWidth: '90px', flex: '1 1 12%' }}>
                                                    {!patient.submissions.geburtsdatum ? (
                                                        <Text>-</Text>
                                                    ) : (
                                                        <Badge
                                                            skin={age <= 18 ? 'standard' : 'premium'}
                                                            size="small"
                                                        >
                                                            {age <= 18 ? 'Kinder' : 'Erwachsene'}
                                                        </Badge>
                                                    )}
                                                </Box>

                                                {/* Actions Column */}
                                                <Box minWidth="50px" style={{ flex: '1 1 10%' }} direction="horizontal" align="right" alignContent="end" className="actions-column">
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <PopoverMenu
                                                            textSize="small"
                                                            triggerElement={
                                                                <IconButton
                                                                    skin="inverted"
                                                                    size="small"
                                                                >
                                                                    <Icons.More />
                                                                </IconButton>
                                                            }
                                                            placement="top"
                                                        >
                                                            <PopoverMenu.MenuItem
                                                                text="Vorschau"
                                                                onClick={() => onViewPatient(patient)}
                                                                prefixIcon={<Icons.Visible />}
                                                            />
                                                            <PopoverMenu.MenuItem
                                                                text="Drucken"
                                                                onClick={() => onPrintPatient(patient)}
                                                                prefixIcon={<Icons.Print />}
                                                            />
                                                            <PopoverMenu.MenuItem
                                                                text="Notiz hinzufügen"
                                                                onClick={() => {
                                                                    // Set editing mode to true
                                                                    setEditingNotes(prev => ({ ...prev, [patient._id]: true }));

                                                                    // Create empty note structure if it doesn't exist
                                                                    if (!notes[patient._id]) {
                                                                        const email = patient.submissions.email_726a?.trim() || '';
                                                                        const name = `${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim();
                                                                        loadNoteForSubmission(patient._id, email, name);
                                                                    }
                                                                }}
                                                                prefixIcon={<Icons.Add />}
                                                            />
                                                            <PopoverMenu.MenuItem
                                                                text="Etikett setzen"
                                                                onClick={() => {
                                                                    setSelectedPatientForLabels(patient);
                                                                    setLabelModalOpen(true);
                                                                }}
                                                                prefixIcon={<Icons.Tag />}
                                                            />
                                                            <PopoverMenu.MenuItem
                                                                text="Bearbeiten"
                                                                onClick={() => onEditPatient(patient)}
                                                                prefixIcon={<Icons.Edit />}
                                                            />
                                                            <PopoverMenu.Divider />
                                                            <PopoverMenu.MenuItem
                                                                text="Löschen"
                                                                onClick={() => onDeletePatient(patient._id)}
                                                                prefixIcon={<Icons.Delete />}
                                                                skin="destructive"
                                                            />

                                                        </PopoverMenu>
                                                    </div>
                                                </Box>
                                            </Box>
                                        </div>

                                        {/* Note Row - Show if note has content OR if we're editing */}
                                        {((note?.notes && note.notes.trim() !== '') || editingNotes[patient._id]) && (
                                            <Box
                                                width="100%"
                                                padding="12px 16px 12px 16px"
                                                backgroundColor="#fff"
                                                borderBottom="1px solid #EAEAEA"
                                                style={{
                                                    borderTop: '1px dashed #CCCCCC'
                                                }}

                                            >

                                                <Input
                                                    className="note-input-container"
                                                    prefix={
                                                        <Input.IconAffix>
                                                            <Icons.Note />
                                                        </Input.IconAffix>
                                                    }
                                                    suffix={
                                                        <Input.IconAffix>
                                                            {editingNotes[patient._id] ? (
                                                                <Box direction="horizontal" gap="SP1" align="right">
                                                                    <TextButton
                                                                        size="tiny"
                                                                        skin="destructive"
                                                                        onClick={() => {
                                                                            setEditingNotes(prev => ({ ...prev, [patient._id]: false }));
                                                                            // Reset the note text to original value
                                                                            const email = patient.submissions.email_726a?.trim() || '';
                                                                            const name = `${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim();
                                                                            loadNoteForSubmission(patient._id, email, name);
                                                                        }}
                                                                    >
                                                                        Abbrechen
                                                                    </TextButton>
                                                                    <TextButton
                                                                        size="tiny"
                                                                        onClick={async () => {
                                                                            const success = await saveNote(patient._id, note.notes);
                                                                            if (success) {
                                                                                setEditingNotes(prev => ({ ...prev, [patient._id]: false }));
                                                                            }
                                                                        }}
                                                                        disabled={loadingNotes[patient._id]}
                                                                    >
                                                                        {loadingNotes[patient._id] ? 'Speichern...' : 'Speichern'}
                                                                    </TextButton>

                                                                </Box>
                                                            ) : (
                                                                <TextButton
                                                                    size="tiny"
                                                                    onClick={() => {
                                                                        setEditingNotes(prev => ({ ...prev, [patient._id]: true }));
                                                                    }}
                                                                >
                                                                    Bearbeiten
                                                                </TextButton>
                                                            )}
                                                        </Input.IconAffix>
                                                    }

                                                    value={note.notes}
                                                    readOnly={!editingNotes[patient._id]}
                                                    size="tiny"
                                                    onChange={(e) => {
                                                        if (editingNotes[patient._id]) {
                                                            updateNoteText(patient._id, e.target.value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && editingNotes[patient._id]) {
                                                            // Save on Enter
                                                            saveNote(patient._id, note.notes).then((success) => {
                                                                if (success) {
                                                                    setEditingNotes(prev => ({ ...prev, [patient._id]: false }));
                                                                }
                                                            });
                                                        }
                                                        if (e.key === 'Escape' && editingNotes[patient._id]) {
                                                            // Cancel on Escape
                                                            setEditingNotes(prev => ({ ...prev, [patient._id]: false }));
                                                            const email = patient.submissions.email_726a?.trim() || '';
                                                            const name = `${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim();
                                                            loadNoteForSubmission(patient._id, email, name);
                                                        }
                                                    }}
                                                />
                                            </Box>

                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Card>
            </Box>

            {totalPages > 1 && (
                <Box
                    direction="vertical"
                    gap="SP1"
                    align="center"


                >
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onChange={(event) => {
                            setIsChangingPage(true);
                            setCurrentPage(event.page);
                            // Reset loading after a brief moment to show visual feedback
                            setTimeout(() => setIsChangingPage(false), 100);
                        }}
                    />
                    <Box textAlign="center">
                        <Text size="small">
                            Zeige {startIndex + 1} bis {endIndex} von {filteredPatients.length} Patienten
                            {searchTerm && ` (gefiltert von ${totalPatients} gesamt)`}
                        </Text>
                    </Box>
                </Box>
            )}

            {totalPages <= 1 && (
                <Box align="center">
                    <Text size="small">
                        Zeige alle {patients.length} Patienten
                    </Text>
                </Box>
            )}

            {/* Label Selection Modal */}
            <LabelSelectionModal
                isOpen={labelModalOpen}
                onClose={() => {
                    setLabelModalOpen(false);
                    setSelectedPatientForLabels(null);
                }}
                patient={selectedPatientForLabels}
                onLabelsAssigned={async () => {
                    // Refresh the note data for the updated patient to show new labels
                    if (selectedPatientForLabels) {
                        const email = selectedPatientForLabels.submissions.email_726a?.trim() || '';
                        const name = `${selectedPatientForLabels.submissions.vorname || ''} ${selectedPatientForLabels.submissions.name_1 || ''}`.trim();
                        loadNoteForSubmission(selectedPatientForLabels._id, email, name);

                        // Also refresh email-based labels from Labels collection
                        if (email) {
                            loadLabelsByEmail(email);
                        }
                    }

                    // Refresh entire patient data to ensure the table shows updated labels
                    if (onRefreshData) {
                        await onRefreshData();
                    }
                }}
            />

        </Box>
    );
};
