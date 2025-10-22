import React, { useState, useEffect, useMemo } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Button,
  Box,
  Text,
  Heading,
  Table,
  TableToolbar,
  TableActionCell,
  Search,
  Badge,
  Avatar,
  Card,
  Pagination,
  Loader,
  Layout,
  Cell,
  MessageModalLayout,
  Modal,
  TextButton,
  Divider,
  IconButton,
  PopoverMenu,
  Tooltip
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { appInstances } from '@wix/app-management';
import { usePatientData } from '../../hooks/usePatientData';
import { useFilters } from '../../hooks/useFilters';
import { PatientTable } from '../../components/PatientTable';
import { FilterPanel } from '../../components/FilterPanel';
import { StatisticsCards } from '../../components/StatisticsCards';
import { PatientDetailsModal } from '../../components/PatientDetailsModal';
import { printPatientDetails } from '../../utils/printUtils';
import { useNotes } from '../../hooks/useNotes';
import { EditSubmissionModal } from '../../components/EditSubmissionModal';


import { submissions } from '@wix/forms';






const PatientDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<any>(null);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [appVersion, setAppVersion] = useState('v1.0.0');

  // Use the custom hook to fetch real patient data
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS

  // Use the custom hook to fetch real patient data
  const {
    allSubmissions,
    loading,
    error,
    loadSubmissions,
    calculateAgeGroups,
    calculateGenderGroups
  } = usePatientData();

  // Use the filter hook
  const {
    filters,
    filteredSubmissions,
    updateFilter,
    clearFilters
  } = useFilters(allSubmissions);

  // Fetch app version
  useEffect(() => {
    const fetchAppVersion = async () => {
      try {
        const response = await appInstances.getAppInstance();
        if (response.instance?.appVersion) {
          setAppVersion(`v${response.instance.appVersion}`);
        }
      } catch (error) {
        console.error('Failed to fetch app version:', error);
        // Keep default version if fetch fails
      }
    };

    fetchAppVersion();
  }, []);

  // Update time every minute - MUST be before conditional returns
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const berlinTime = now.toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const berlinDate = now.toLocaleDateString('de-DE', {
        timeZone: 'Europe/Berlin',
        day: 'numeric',
        month: 'long'
      });

      setCurrentTime(berlinTime);
      setCurrentDate(berlinDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics
  const ageGroups = calculateAgeGroups(allSubmissions);
  const genderGroups = calculateGenderGroups(allSubmissions);
  const waitingTime = { months: 7, days: 23 }; // You can calculate this based on real data later

  // NOW you can do conditional returns - AFTER all hooks are called
  if (loading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Box textAlign="center" padding="80px">
            <Loader />
            <Text>Lade Patientendaten...</Text>
          </Box>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  if (error) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Box textAlign="center" padding="40px">
            <Text>Fehler beim Laden der Daten: {error}</Text>
            <Button onClick={loadSubmissions}>Erneut versuchen</Button>
          </Box>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const handleRefresh = async () => {
    dashboard.showToast({
      message: 'Daten werden aktualisiert...',
      type: 'success',
    });
    await loadSubmissions();
  };

  const handleAddNewRegistration = () => {
    window.open('https://www.logopaedie-falkensee.de/anmeldung', '_blank');
  };

  const handleViewPatient = (patient: any) => {
    console.log('handleViewPatient called with:', patient);
    setSelectedPatient(patient);
    setIsModalOpen(true);
    console.log('Modal should be open now, isModalOpen:', true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handlePrintPatient = (patient: any) => {
    console.log('Printing patient:', patient);
    printPatientDetails(patient);
  };

  const handleEditPatient = (patient: any) => {
    console.log('Editing patient:', patient);
    setPatientToEdit(patient);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setPatientToEdit(null);
  };

  const handleSaveEdit = async () => {
    // Refresh the data after successful save
    await loadSubmissions();
  };

  const handleDeletePatient = (patientId: string) => {
    console.log('handleDeletePatient called with ID:', patientId);
    console.log('All submissions:', allSubmissions);

    // Find the patient to show their name in the modal
    const patient = allSubmissions.find(p => p._id === patientId);
    console.log('Found patient:', patient);

    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);

    console.log('Modal state set to true');
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      console.log('Deleting patient with ID:', patientToDelete._id);

      await submissions.deleteSubmission(patientToDelete._id, {
        permanent: false
      });
      dashboard.showToast({
        message: 'Patient erfolgreich gelöscht',
        type: 'success',
      });

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
      await loadSubmissions();

    } catch (error) {
      console.error('Error deleting patient:', error);

      // Show error message
      dashboard.showToast({
        message: 'Fehler beim Löschen des Patienten',
        type: 'error',
      });
    }
  };

  const cancelDeletePatient = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
  };

  const handleOpenTrash = () => {
    try {
      const url = 'https://manage.wix.com/dashboard/69ff8e01-cfc2-4e5e-b7e1-37fc3e49370b/wix-forms/form/265b5dc7-98f6-418f-b3c6-6d1530c209f3/submissions?folder=%5B%7B%22id%22%3A%22deleted%22%2C%22name%22%3A%22Trash%22%7D%5D&sort=createdDate+desc';
      window.open(url, '_blank'); // opens in a new tab
    } catch (error) {
      console.error('Failed to open trash link:', error);
      dashboard.showToast({
        message: 'Trash page temporarily unavailable',
        type: 'warning'
      });
    }
  };


  const handleOpenNotes = () => {
    try {
      const url = 'https://manage.wix.com/dashboard/69ff8e01-cfc2-4e5e-b7e1-37fc3e49370b/database/data/Notes?referralInfo=sidebar';
      window.open(url, '_blank'); // opens in a new tab
    } catch (error) {
      console.error('Failed to open notes link:', error);
      dashboard.showToast({
        message: 'Notes page temporarily unavailable',
        type: 'warning'
      });
    }
  };

  // More Actions menu items
  const moreActionsMenuItems = [
    {
      text: 'Papierkorb',
      prefixIcon: <Icons.Delete />,
      onClick: handleOpenTrash
    },
    {
      text: 'Notizen und Etiketten',
      prefixIcon: <Icons.Note />,
      onClick: handleOpenNotes
    }
  ];

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page minWidth={950}>
        <Page.Header
          title={
            <Box direction="horizontal" gap="SP2" align="left">
              <span>Patientenliste</span>
              <Badge size="small" skin="standard" type="solid">
                {appVersion}
              </Badge>
              {/* <TextButton
                prefixIcon={<Icons.Hint size="20px" />}
                size="small"
                underline="always"
                onClick={() => setIsWhatsNewOpen(true)}
                skin="premium"
              >
                Neuigkeiten
              </TextButton> */}
            </Box>
          }

          subtitle={
            <TextButton
              onClick={() => window.open('https://www.logopaedie-falkensee.de/', '_blank', 'noopener,noreferrer')}
              size="small"
              skin="standard"
              suffixIcon={<Icons.ExternalLink size="14px" />}
              underline="always"
            >
              www.logopaedie-falkensee.de
            </TextButton>
          }
          actionsBar={
            <Box direction="horizontal" gap="SP3">
              <Tooltip content="Aktualisieren">
                <IconButton onClick={handleRefresh} skin="standard" priority="secondary">
                  <Icons.Refresh />
                </IconButton>
              </Tooltip>
              {/* More Actions PopoverMenu */}
              <Box direction="horizontal" align="center">
                <PopoverMenu
                  triggerElement={
                    <Button
                      suffixIcon={<Icons.ChevronDown />}
                      size="medium"
                      skin="standard"
                      priority="secondary"
                    >
                      Weitere Aktionen
                    </Button>
                  }
                  placement="bottom"
                >
                  {moreActionsMenuItems.map((item, index) => (
                    <PopoverMenu.MenuItem
                      key={index}
                      onClick={item.onClick}
                      prefixIcon={item.prefixIcon}
                      text={item.text}
                    />
                  ))}
                </PopoverMenu>
              </Box>
              <Button
                onClick={handleAddNewRegistration}
                prefixIcon={<Icons.Add />}
              >
                Neue Einreichung Hinzufügen
              </Button>
            </Box>
          }
        />

        <Page.Content>
          <Layout>
            <Cell>
              {/* Statistics Cards Section - Full Width */}
              <Box marginBottom="SP4">
                <StatisticsCards
                  totalPatients={allSubmissions.length}
                  waitingTime={waitingTime}
                  ageGroups={ageGroups}
                  genderGroups={genderGroups}
                  currentTime={currentTime}
                  currentDate={currentDate}
                />
              </Box>

              {/* Main Content Area - Two Column Layout */}
              <Layout>
                {/* Left Column - Patient Table (70% = span 8.4, round to 8) */}
                <Cell span={9}>
                  <PatientTable
                    patients={filteredSubmissions}
                    onViewPatient={handleViewPatient}
                    onPrintPatient={handlePrintPatient}
                    onDeletePatient={handleDeletePatient}
                    onEditPatient={handleEditPatient}
                    onUpdatePatientStatus={(id, status) => console.log('Update status', id, status)}
                    searchTerm={filters.searchTerm}
                    onSearchChange={(value) => updateFilter('searchTerm', value)}
                    totalPatients={allSubmissions.length}
                    onRefreshData={loadSubmissions}
                  />
                </Cell>

                {/* Right Column - Filter Panel (30% = span 3.6, round to 4) */}
                <Cell span={3}>
                  <Box position="sticky" top="90px" maxHeight="calc(100vh - 115px)" overflow="scroll" background="white" borderRadius="8px">
                    <FilterPanel
                      filters={filters}
                      onFilterChange={updateFilter}
                      onClearFilters={clearFilters}
                    />
                  </Box>
                </Cell>
              </Layout>
            </Cell>
          </Layout>
        </Page.Content>
      </Page>
      {isModalOpen && (
        <PatientDetailsModal
          patient={selectedPatient}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onPrint={handlePrintPatient}
        />
      )}

      {isDeleteModalOpen && patientToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onRequestClose={cancelDeletePatient}
          shouldCloseOnOverlayClick={true}
          screen="desktop"
        >
          <MessageModalLayout
            theme="destructive"
            onCloseButtonClick={cancelDeletePatient}
            primaryButtonText="Löschen"
            secondaryButtonText="Abbrechen"
            primaryButtonOnClick={confirmDeletePatient}
            secondaryButtonOnClick={cancelDeletePatient}
            title="Patient löschen"
            content={
              <Text>
                Sie sind dabei, den Patienten <b>{`${patientToDelete.submissions.vorname || ''} ${patientToDelete.submissions.name_1 || ''}`.trim()}</b> zu löschen.
                Sie können diesen Patienten später immer noch aus der Bin-Sammlung wiederherstellen.
              </Text>
            }
          />
        </Modal>
      )}

      {isEditModalOpen && patientToEdit && (
        <EditSubmissionModal
          patient={patientToEdit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      <Modal
        isOpen={isWhatsNewOpen}
        onRequestClose={() => setIsWhatsNewOpen(false)}
        shouldCloseOnOverlayClick={true}
        screen="desktop"
      >
        <Box padding="24px" background="white" direction="vertical" borderRadius="8px" gap="16px">
          <Box textAlign="left">
            <Text size="medium" weight="bold" marginBottom="16px">Was gibt's Neues?</Text>
          </Box>

          <Box textAlign="left" direction="vertical" align="left">
            <Box direction="vertical" gap="8px" marginBottom="16px" textAlign="left">
              <Text>•  Vollständige Bearbeitung der Patienteneinreichung</Text>
              <Text>•  Klicken Sie auf eine Zeile, um die Einreichung in der Vorschau anzuzeigen</Text>
              <Text>•  Dem Formular wurde das Kontrollkästchen „Ich bin flexibel“ hinzugefügt, mit dem Sie und der Patient automatisch alle Zeitfenster auswählen können.</Text>
              <Text>•  Neuer Filter für Schon einmal in Behandlung</Text>
              <Text>•  Den Namen der anmeldenden Person finden Sie unter dem Patientennamen.</Text>
              <Text>•  Filter für doppelte Namen, um Ihre Liste sauber zu halten</Text>
              <Text>•  Filter bleiben auch nach der Aktualisierung der Tabelle aktiv</Text>
              <Text>•  Notizen werden jetzt gespeichert</Text>
              <Text>•  Bessere Übersichtlichkeit mit verbesserten Badges</Text>
              <Text>•  Schlankeres Statistik-Panel für mehr Fokus auf die Patiententabelle</Text>
            </Box>

            <Box textAlign="left" marginTop="16px">
              <Text size="medium" weight="bold" marginBottom="16px">Erinnerung</Text>
            </Box>
            <Box direction="vertical" gap="8px" marginTop="16px" textAlign="left">
              <Text>•  Klicken Sie auf den Spaltentitel „Datum (Neueste)“, um zwischen den ältesten oder neuesten Einreichungen zu wechseln.</Text>

            </Box>
            <Box direction="horizontal" gap="12px" align="right" marginTop="24px">
              <Button
                onClick={() => setIsWhatsNewOpen(false)}
                priority="primary"
              >
                Verstanden
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </WixDesignSystemProvider>
  );
};

export default PatientDashboard;
