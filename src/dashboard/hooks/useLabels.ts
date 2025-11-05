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

  // Load labels for a specific email (from Labels collection)
  const loadLabelsByEmail = useCallback(async (email: string) => {
    if (!email || email.trim() === '') {
      console.log('🔄 No email provided, skipping label load');
      return;
    }

    const trimmedEmail = email.trim();

    if (loadingEmailLabels[trimmedEmail]) {
      console.log('🔄 Already loading labels for email:', trimmedEmail);
      return;
    }

    console.log('🚀 Starting to load labels for email:', trimmedEmail);
    setLoadingEmailLabels(prev => ({ ...prev, [trimmedEmail]: true }));

    try {
      console.log('🔍 Calling getLabelsByEmail API for:', trimmedEmail);
      const response = await getLabelsByEmail(trimmedEmail);

      console.log('📋 API Response for email', trimmedEmail, ':', response);

      if (response.success && response.data) {
        console.log('✅ Email labels loaded for', trimmedEmail, ':', response.data);
        setEmailLabels(prev => {
          const updated = { ...prev, [trimmedEmail]: response.data || [] };
          console.log('🏷️ Updated emailLabels state:', updated);
          return updated;
        });
      } else {
        console.error('❌ Error loading email labels for', trimmedEmail, ':', response.error);
        setEmailLabels(prev => ({ ...prev, [trimmedEmail]: [] }));
      }
    } catch (error) {
      console.error('❌ Exception loading email labels for', trimmedEmail, ':', error);
      setEmailLabels(prev => ({ ...prev, [trimmedEmail]: [] }));
    } finally {
      setLoadingEmailLabels(prev => ({ ...prev, [trimmedEmail]: false }));
    }
  }, []);

  // Load labels for multiple emails in batch (for performance)
  const loadBatchLabelsByEmails = useCallback(async (emails: string[]) => {
    if (!emails || emails.length === 0) {
      console.log('🔄 No emails provided for batch loading');
      return;
    }

    const validEmails = emails.filter(email => email && email.trim() !== '').map(email => email.trim());

    if (validEmails.length === 0) {
      console.log('🔄 No valid emails for batch loading');
      return;
    }

    // Check which emails we don't already have loaded or are loading
    const emailsToLoad = validEmails.filter(email =>
      !emailLabels[email] && !loadingEmailLabels[email]
    );

    if (emailsToLoad.length === 0) {
      console.log('🔄 All emails already loaded or loading');
      return;
    }

    console.log('🚀 Starting batch load for emails:', emailsToLoad);

    // Mark all emails as loading
    setLoadingEmailLabels(prev => {
      const updated = { ...prev };
      emailsToLoad.forEach(email => {
        updated[email] = true;
      });
      return updated;
    });

    try {
      console.log('🔍 Calling getBatchLabelsByEmails API for:', emailsToLoad);
      const response = await getBatchLabelsByEmails(emailsToLoad);

      console.log('📋 Batch API Response:', response);

      if (response.success && response.data) {
        console.log('✅ Batch email labels loaded:', response.data);
        setEmailLabels(prev => {
          const updated = { ...prev, ...response.data };
          console.log('🏷️ Updated emailLabels state:', updated);
          return updated;
        });
      } else {
        console.error('❌ Error loading batch email labels:', response.error);
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
      console.error('❌ Exception loading batch email labels:', error);
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
      console.log('🏷️ Assigning labels to email (Labels collection):', { submissionId, email, name, labelKeys });
      const response = await assignLabelsToContact(submissionId, email, name, labelKeys);

      if (response.success) {
        console.log('✅ Labels assigned successfully to Labels collection');
        // Update local caches for both submission and email
        setContactLabels(prev => ({ ...prev, [submissionId]: labelKeys }));
        if (email && email.trim() !== '') {
          setEmailLabels(prev => ({ ...prev, [email.trim()]: labelKeys }));
        }
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