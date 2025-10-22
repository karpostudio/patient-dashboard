import { useState, useCallback, useEffect } from 'react';
import { listLabels, assignLabelsToContact, getContactLabels, findOrCreateLabel } from '../../backend/labels-api.web';

export interface Label {
  key: string;
  displayName: string;
  labelType: string;
}

export const useLabels = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState<boolean>(false);
  const [contactLabels, setContactLabels] = useState<{ [submissionId: string]: string[] }>({});
  const [loadingContactLabels, setLoadingContactLabels] = useState<{ [submissionId: string]: boolean }>({});

  // Load all available labels
  const loadLabels = useCallback(async () => {
    if (loadingLabels) return;

    setLoadingLabels(true);
    try {
      console.log('🏷️ Loading all labels...');
      const response = await listLabels();

      if (response.success && response.data) {
        console.log('✅ Labels loaded:', response.data);
        setLabels(response.data);
      } else {
        console.error('❌ Error loading labels:', response.error);
        // Set empty array if there's an error to stop loading state
        setLabels([]);
      }
    } catch (error) {
      console.error('❌ Exception loading labels:', error);
      // Set empty array if there's an exception to stop loading state
      setLabels([]);
    } finally {
      setLoadingLabels(false);
    }
  }, [loadingLabels]);

  // Load labels for a specific contact
  const loadContactLabels = useCallback(async (submissionId: string) => {
    if (loadingContactLabels[submissionId]) {
      console.log('🔄 Already loading labels for:', submissionId);
      return;
    }

    console.log('🚀 Starting to load labels for submission:', submissionId);
    setLoadingContactLabels(prev => ({ ...prev, [submissionId]: true }));

    try {
      console.log('🔍 Calling getContactLabels API for:', submissionId);
      const response = await getContactLabels(submissionId);

      console.log('📋 API Response for', submissionId, ':', response);

      if (response.success && response.data) {
        console.log('✅ Contact labels loaded for', submissionId, ':', response.data);
        setContactLabels(prev => {
          const updated = { ...prev, [submissionId]: response.data || [] };
          console.log('🏷️ Updated contactLabels state:', updated);
          return updated;
        });
      } else {
        console.error('❌ Error loading contact labels for', submissionId, ':', response.error);
        setContactLabels(prev => ({ ...prev, [submissionId]: [] }));
      }
    } catch (error) {
      console.error('❌ Exception loading contact labels for', submissionId, ':', error);
      setContactLabels(prev => ({ ...prev, [submissionId]: [] }));
    } finally {
      setLoadingContactLabels(prev => ({ ...prev, [submissionId]: false }));
    }
  }, []); // Remove loadingContactLabels dependency to prevent callback recreation

  // Assign labels to a contact (same pattern as notes system)
  const assignLabels = useCallback(async (submissionId: string, email: string, name: string, labelKeys: string[]): Promise<boolean> => {
    try {
      console.log('🏷️ Assigning labels to submission:', { submissionId, email, name, labelKeys });
      const response = await assignLabelsToContact(submissionId, email, name, labelKeys);

      if (response.success) {
        console.log('✅ Labels assigned successfully');
        // Update local cache
        setContactLabels(prev => ({ ...prev, [submissionId]: labelKeys }));
        return true;
      } else {
        console.error('❌ Error assigning labels:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Exception assigning labels:', error);
      return false;
    }
  }, []);

  // Create a new label if it doesn't exist
  const createLabel = useCallback(async (displayName: string): Promise<Label | null> => {
    try {
      console.log('🆕 Creating/finding label:', displayName);
      const response = await findOrCreateLabel(displayName);

      if (response.success && response.data) {
        console.log('✅ Label created/found:', response.data);
        // Add to local cache if it's new
        setLabels(prev => {
          const exists = prev.some(label => label.key === response.data!.key);
          return exists ? prev : [...prev, response.data!];
        });
        return response.data;
      } else {
        console.error('❌ Error creating label:', response.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Exception creating label:', error);
      return null;
    }
  }, []);

  // Auto-load labels on hook initialization (only once)
  useEffect(() => {
    if (labels.length === 0 && !loadingLabels) {
      loadLabels();
    }
  }, []); // Empty dependency array to run only once

  // Force reload labels function for debugging
  const forceReloadLabels = useCallback(async () => {
    setLoadingLabels(true);
    setLabels([]); // Clear existing labels
    try {
      console.log('🔄 Force reloading labels...');
      const response = await listLabels();

      if (response.success && response.data) {
        console.log('✅ Labels force reloaded:', response.data);
        setLabels(response.data);
      } else {
        console.error('❌ Error force reloading labels:', response.error);
        setLabels([]);
      }
    } catch (error) {
      console.error('❌ Exception force reloading labels:', error);
      setLabels([]);
    } finally {
      setLoadingLabels(false);
    }
  }, []);

  return {
    labels,
    loadingLabels,
    contactLabels,
    loadingContactLabels,
    loadLabels,
    loadContactLabels,
    assignLabels,
    createLabel,
    forceReloadLabels
  };
};