import { useState, useCallback, useEffect } from 'react';
import { listLabels, assignLabelsToContact, getContactLabels, getLabelsByEmail, getBatchLabelsByEmails, findOrCreateLabel } from '../../backend/labels-api.web';

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
  const [emailLabels, setEmailLabels] = useState<{ [email: string]: string[] }>({});
  const [loadingEmailLabels, setLoadingEmailLabels] = useState<{ [email: string]: boolean }>({});

  // Load all available labels
  const loadLabels = useCallback(async () => {
    if (loadingLabels) return;

    setLoadingLabels(true);
    try {
      const response = await listLabels();

      if (response.success && response.data) {
        setLabels(response.data);
      } else {
        setLabels([]);
      }
    } catch (error) {
      setLabels([]);
    } finally {
      setLoadingLabels(false);
    }
  }, [loadingLabels]);

  // Load labels for a specific contact
  const loadContactLabels = useCallback(async (submissionId: string) => {
    if (loadingContactLabels[submissionId]) {
      return;
    }

    setLoadingContactLabels(prev => ({ ...prev, [submissionId]: true }));

    try {
      const response = await getContactLabels(submissionId);

      if (response.success && response.data) {
        setContactLabels(prev => ({ ...prev, [submissionId]: response.data || [] }));
      } else {
        setContactLabels(prev => ({ ...prev, [submissionId]: [] }));
      }
    } catch (error) {
      setContactLabels(prev => ({ ...prev, [submissionId]: [] }));
    } finally {
      setLoadingContactLabels(prev => ({ ...prev, [submissionId]: false }));
    }
  }, []);

  // Load labels for a specific email (from Labels collection)
  const loadLabelsByEmail = useCallback(async (email: string) => {
    if (!email || email.trim() === '') {
      return;
    }

    const trimmedEmail = email.trim();

    if (loadingEmailLabels[trimmedEmail]) {
      return;
    }

    setLoadingEmailLabels(prev => ({ ...prev, [trimmedEmail]: true }));

    try {
      const response = await getLabelsByEmail(trimmedEmail);

      if (response.success && response.data) {
        setEmailLabels(prev => ({ ...prev, [trimmedEmail]: response.data || [] }));
      } else {
        setEmailLabels(prev => ({ ...prev, [trimmedEmail]: [] }));
      }
    } catch (error) {
      setEmailLabels(prev => ({ ...prev, [trimmedEmail]: [] }));
    } finally {
      setLoadingEmailLabels(prev => ({ ...prev, [trimmedEmail]: false }));
    }
  }, []);

  // Load labels for multiple emails in batch (for performance)
  const loadBatchLabelsByEmails = useCallback(async (emails: string[]) => {
    if (!emails || emails.length === 0) {
      return;
    }

    const validEmails = emails.filter(email => email && email.trim() !== '').map(email => email.trim());

    if (validEmails.length === 0) {
      return;
    }

    // Check which emails we don't already have loaded or are loading
    const emailsToLoad = validEmails.filter(email =>
      !emailLabels[email] && !loadingEmailLabels[email]
    );

    if (emailsToLoad.length === 0) {
      return;
    }

    // Mark all emails as loading
    setLoadingEmailLabels(prev => {
      const updated = { ...prev };
      emailsToLoad.forEach(email => {
        updated[email] = true;
      });
      return updated;
    });

    try {
      const response = await getBatchLabelsByEmails(emailsToLoad);

      if (response.success && response.data) {
        setEmailLabels(prev => ({ ...prev, ...response.data }));
      } else {
        // Set empty arrays for failed emails
        setEmailLabels(prev => {
          const updated = { ...prev };
          emailsToLoad.forEach(email => {
            updated[email] = [];
          });
          return updated;
        });
      }
    } catch (error) {
      // Set empty arrays for failed emails
      setEmailLabels(prev => {
        const updated = { ...prev };
        emailsToLoad.forEach(email => {
          updated[email] = [];
        });
        return updated;
      });
    } finally {
      // Mark all emails as no longer loading
      setLoadingEmailLabels(prev => {
        const updated = { ...prev };
        emailsToLoad.forEach(email => {
          updated[email] = false;
        });
        return updated;
      });
    }
  }, [emailLabels, loadingEmailLabels]);

  // Assign labels to a contact (via Labels collection for email-based inheritance)
  const assignLabels = useCallback(async (submissionId: string, email: string, name: string, labelKeys: string[]): Promise<boolean> => {
    try {
      const response = await assignLabelsToContact(submissionId, email, name, labelKeys);

      if (response.success) {
        // Update local caches for both submission and email
        setContactLabels(prev => ({ ...prev, [submissionId]: labelKeys }));
        if (email && email.trim() !== '') {
          setEmailLabels(prev => ({ ...prev, [email.trim()]: labelKeys }));
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }, []);

  // Create a new label if it doesn't exist
  const createLabel = useCallback(async (displayName: string): Promise<Label | null> => {
    try {
      const response = await findOrCreateLabel(displayName);

      if (response.success && response.data) {
        // Add to local cache if it's new
        setLabels(prev => {
          const exists = prev.some(label => label.key === response.data!.key);
          return exists ? prev : [...prev, response.data!];
        });
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }, []);

  // Auto-load labels on hook initialization (only once)
  useEffect(() => {
    if (labels.length === 0 && !loadingLabels) {
      loadLabels();
    }
  }, []);

  // Force reload labels function
  const forceReloadLabels = useCallback(async () => {
    setLoadingLabels(true);
    setLabels([]);
    try {
      const response = await listLabels();

      if (response.success && response.data) {
        setLabels(response.data);
      } else {
        setLabels([]);
      }
    } catch (error) {
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
    emailLabels,
    loadingEmailLabels,
    loadLabels,
    loadContactLabels,
    loadLabelsByEmail,
    loadBatchLabelsByEmails,
    assignLabels,
    createLabel,
    forceReloadLabels
  };
};
