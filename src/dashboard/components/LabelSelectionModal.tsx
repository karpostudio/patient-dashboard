import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Text,
  Button,
  Checkbox,
  Loader,
  EmptyState,
  Input,
  Badge,
  Heading,
  Divider,
  Tooltip,
  IconButton
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { useLabels } from '../hooks/useLabels';
import { PatientSubmission } from '../types';

interface LabelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientSubmission | null;
  onLabelsAssigned?: () => void;
}

export const LabelSelectionModal: React.FC<LabelSelectionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onLabelsAssigned
}) => {
  const {
    labels,
    loadingLabels,
    emailLabels,
    loadingEmailLabels,
    loadLabelsByEmail,
    assignLabels,
    createLabel,
    forceReloadLabels
  } = useLabels();

  const [selectedLabelKeys, setSelectedLabelKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [creatingLabel, setCreatingLabel] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLabelKeys([]);
      setNewLabelName('');
      setCreatingLabel(false);
      setSaving(false);
    }
  }, [isOpen]);

  // Load email-based labels when patient changes and modal is open
  useEffect(() => {
    if (patient && isOpen) {
      // Use the patient email for email-based label inheritance
      const email = patient.submissions.email_726a?.trim() || '';
      if (email) {
        // Always reload labels when modal opens to ensure fresh data
        loadLabelsByEmail(email);
      }
    }
  }, [patient, isOpen, loadLabelsByEmail]);

  // Update selected labels when email-based labels are loaded
  useEffect(() => {
    if (patient && isOpen) {
      const email = patient.submissions.email_726a?.trim() || '';
      if (email && emailLabels[email]) {
        console.log('🏷️ Setting selected labels from email-based data:', emailLabels[email]);
        setSelectedLabelKeys(emailLabels[email]);
      } else if (email) {
        // Reset selection if no labels found for this email
        console.log('🏷️ No email labels found, resetting selection');
        setSelectedLabelKeys([]);
      }
    }
  }, [patient, emailLabels, isOpen]);

  const handleLabelToggle = (labelKey: string) => {
    setSelectedLabelKeys(prev => {
      if (prev.includes(labelKey)) {
        return prev.filter(key => key !== labelKey);
      } else {
        return [...prev, labelKey];
      }
    });
  };

  const handleSave = async () => {
    if (!patient) return;

    setSaving(true);
    try {
      const submissionId = patient._id;
      const email = patient.submissions.email_726a?.trim() || '';
      const name = `${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim();

      const success = await assignLabels(submissionId, email, name, selectedLabelKeys);

      if (success) {
        onLabelsAssigned?.();
        onClose();
      }
    } catch (error) {
      console.error('Error saving labels:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewLabel = async () => {
    if (!newLabelName.trim()) return;

    setCreatingLabel(true);
    try {
      const newLabel = await createLabel(newLabelName.trim());
      if (newLabel) {
        setSelectedLabelKeys(prev => [...prev, newLabel.key]);
        setNewLabelName('');
      }
    } catch (error) {
      console.error('Error creating label:', error);
    } finally {
      setCreatingLabel(false);
    }
  };

  const currentContactLabels = patient
    ? emailLabels[patient.submissions.email_726a?.trim() || ''] || []
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      shouldDisplayCloseButton={true}
      contentLabel="Etikett setzen"
    >
      <Box
        direction="vertical"
        gap="SP4"
        padding="SP4"
        minWidth="500px"
        maxWidth="600px"
        backgroundColor="white"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          minWidth: '500px',
          maxWidth: '600px'
        }}
      >
        {/* Header */}
        <Box direction="vertical" gap="SP2" align="left">
          <Box direction="horizontal" gap="SP2" align="left" style={{ alignItems: 'center' }}>
            <Heading align="left" size="medium" weight="bold">Etikett setzen</Heading>
            <Tooltip
              content="Etiketten sind mit E-Mails verknüpft. Das bedeutet, dass mehrere Einsendungen mit derselben E-Mail-Adresse automatisch dieselben Etiketten anzeigen."
              placement="top"
            >
              <IconButton
                size="tiny"
                skin="light"
              >
                <Icons.InfoCircle />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />

          {patient && (
            <Box direction="vertical" gap="SP1">
              <Text size="small">
                Patient: {`${patient.submissions.vorname || ''} ${patient.submissions.name_1 || ''}`.trim()}
              </Text>
              <Text size="small" secondary>
                Email: {patient.submissions.email_726a || 'Keine E-Mail'}
              </Text>
            </Box>
          )}
        </Box>

        {/* Create new label section */}
        <Box direction="vertical" gap="SP2" align="left" paddingBottom="SP2">
          <Text size="medium" weight="normal">Neues Etikett erstellen</Text>
          <Box direction="horizontal" gap="SP2" align="left" style={{ alignItems: 'center' }}>
            <Box flex={1}>
              <Input
                placeholder="Etikett-Name eingeben..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLabelName.trim()) {
                    handleCreateNewLabel();
                  }
                }}
              />
            </Box>
            <Button
              size="small"
              onClick={handleCreateNewLabel}
              disabled={!newLabelName.trim() || creatingLabel}
              prefixIcon={creatingLabel ? <Loader size="tiny" /> : <Icons.Add />}
            >
              {creatingLabel ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </Box>
        </Box>


        {/* Labels selection */}
        <Box direction="horizontal" align="space-between" style={{ alignItems: 'center' }}>
          <Text size="medium" weight="normal">Verfügbare Etiketten</Text>
          <Button
            size="tiny"
            skin="light"
            onClick={() => {
              console.log('Manual refresh clicked');
              forceReloadLabels();
            }}
            prefixIcon={<Icons.Refresh />}
          >
            Aktualisieren
          </Button>
        </Box>

        {loadingLabels ? (
          <Box align="left" padding="SP4" gap="SP2">
            <Loader size="tiny" />
            <Text size="small" secondary>Lade Etiketten...</Text>
          </Box>
        ) : labels.length === 0 ? (
          <Box direction="vertical" gap="SP2" align="center" padding="SP4">
            <EmptyState
              title="Keine Etiketten verfügbar"
              subtitle="Erstellen Sie Ihr erstes Etikett oben oder klicken Sie auf Aktualisieren"
              image={<Icons.Tag />}
            />
          </Box>
        ) : (
          <Box direction="vertical" gap="SP2" align="left" paddingBottom="SP2">
            {labels.map((label) => (
              <Box key={label.key} direction="horizontal" align="left" gap="SP2" style={{ alignItems: 'center' }}>
                <Checkbox
                  checked={selectedLabelKeys.includes(label.key)}
                  onChange={() => handleLabelToggle(label.key)}
                />
                <Text size="small">{label.displayName}</Text>
                {label.labelType === 'SYSTEM' && (
                  <Text size="tiny" secondary>(System)</Text>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Currently assigned labels info */}
        {currentContactLabels.length > 0 && (
          <Box direction="vertical" gap="SP2" align="left" paddingBottom="SP2">
            <Text size="medium" weight="normal">
              Aktuell zugewiesene Etiketten:
            </Text>
            <Box direction="horizontal" gap="SP1" align="left" style={{ flexWrap: 'wrap' }}>
              {currentContactLabels.map((labelKey: string) => {
                const label = labels.find(l => l.key === labelKey);
                return (
                  <Badge
                    key={labelKey}
                    skin="general"
                    size="tiny"
                  >
                    {label ? label.displayName : labelKey}
                  </Badge>
                );
              })}
            </Box>
          </Box>
        )}


        {/* Footer with buttons */}
        <Divider />
        <Box direction="horizontal" gap="SP2" align="right">
          <Button
            skin="light"
            onClick={onClose}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !patient}
            prefixIcon={saving ? <Loader size="tiny" /> : <Icons.Confirm />}
          >
            {saving ? 'Speichern...' : 'Etiketten speichern'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};