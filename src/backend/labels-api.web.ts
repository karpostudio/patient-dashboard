import { webMethod, Permissions } from '@wix/web-methods';
import { items } from '@wix/data';

// CORS configuration for web methods
const corsConfig = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

interface Label {
  key: string;
  displayName: string;
  labelType: string;
}

interface NoteItem {
  _id?: string;
  submissionId?: string;
  email?: string;
  name?: string;
  notes?: string;
  labelTags?: any[];
  _createdDate?: string;
  _updatedDate?: string;
}

interface LabelRecord {
  _id?: string;
  email: string;
  labelTags: string[];
  _createdDate?: string;
  _updatedDate?: string;
}

interface BackendResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  debug?: any;
}

// Get all unique labels from both Notes and Labels collections
export const listLabels = webMethod(
  Permissions.Anyone,
  async (): Promise<BackendResponse<Label[]>> => {
    try {
      console.log('Fetching all unique labels from Notes and Labels collections...');

      // Get labels from Notes collection (legacy)
      const notesResult = await items.query("Notes")
        .limit(1000)
        .find();

      // Get labels from Labels collection (new email-based)
      const labelsResult = await items.query("Labels")
        .limit(1000)
        .find();

      console.log('Notes query result:', notesResult);
      console.log('Labels query result:', labelsResult);

      // Extract all unique labels from both collections
      const allLabels = new Set<string>();

      // From Notes collection
      notesResult.items.forEach((note: any) => {
        if (note.labelTags && Array.isArray(note.labelTags)) {
          note.labelTags.forEach((tag: any) => {
            if (tag && typeof tag === 'string') {
              allLabels.add(tag.trim());
            }
          });
        }
      });

      // From Labels collection
      labelsResult.items.forEach((labelRecord: any) => {
        if (labelRecord.labelTags && Array.isArray(labelRecord.labelTags)) {
          labelRecord.labelTags.forEach((tag: any) => {
            if (tag && typeof tag === 'string') {
              allLabels.add(tag.trim());
            }
          });
        }
      });

      // Convert to Label format
      const labelsList: Label[] = Array.from(allLabels).map(labelName => ({
        key: labelName,
        displayName: labelName,
        labelType: 'USER_DEFINED'
      }));

      return {
        success: true,
        data: labelsList,
        debug: {
          totalNotesQueried: notesResult.items.length,
          totalLabelsQueried: labelsResult.items.length,
          notesWithLabels: notesResult.items.filter((note: any) => note.labelTags && Array.isArray(note.labelTags) && note.labelTags.length > 0).length,
          labelsWithTags: labelsResult.items.filter((record: any) => record.labelTags && Array.isArray(record.labelTags) && record.labelTags.length > 0).length,
          uniqueLabelsFound: labelsList.length,
          rawLabels: Array.from(allLabels)
        }
      };
    } catch (error) {
      console.error('Error fetching labels:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          error,
          errorType: error?.constructor?.name,
          errorDetails: JSON.stringify(error, null, 2)
        }
      };
    }
  }
);

// Assign labels to a contact (via Labels collection for email-based inheritance)
export const assignLabelsToContact = webMethod(
  Permissions.Anyone,
  async (submissionId: string, email: string, name: string, labelTags: string[]): Promise<BackendResponse> => {
    try {
      console.log('Assigning labels to contact via Labels collection:', { submissionId, email, name, labelTags });

      if (!email || email.trim() === '') {
        return {
          success: false,
          error: 'Email is required for label assignment'
        };
      }

      const trimmedEmail = email.trim();

      // Find existing label record for this email in Labels collection
      const existingLabelRecord = await items.query("Labels")
        .eq("email", trimmedEmail)
        .limit(1)
        .find();

      let result;

      if (existingLabelRecord.items.length > 0) {
        // Update existing label record
        const labelRecord = existingLabelRecord.items[0];
        result = await items.update("Labels", {
          _id: labelRecord._id,
          email: trimmedEmail,
          labelTags: labelTags
        });
        console.log('Updated existing label record:', result);
      } else {
        // Create new label record
        result = await items.insert("Labels", {
          email: trimmedEmail,
          labelTags: labelTags
        });
        console.log('Created new label record:', result);
      }

      return {
        success: true,
        data: result,
        debug: {
          submissionId,
          email: trimmedEmail,
          name,
          labelTags,
          labelRecordId: result._id,
          wasUpdate: existingLabelRecord.items.length > 0,
          message: 'Labels stored in Labels collection for email-based inheritance'
        }
      };
    } catch (error) {
      console.error('Error assigning labels to contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: { submissionId, email, name, labelTags, error }
      };
    }
  }
);

// Get labels by email (from Labels collection for email-based inheritance)
export const getLabelsByEmail = webMethod(
  Permissions.Anyone,
  async (email: string): Promise<BackendResponse<string[]>> => {
    try {
      console.log('Fetching labels by email from Labels collection:', email);

      if (!email || email.trim() === '') {
        return {
          success: true,
          data: [],
          debug: {
            email,
            message: 'No email provided, returning empty labels'
          }
        };
      }

      const trimmedEmail = email.trim();

      const labelResult = await items.query("Labels")
        .eq("email", trimmedEmail)
        .limit(1)
        .find();

      console.log('Label record details for email:', labelResult);

      let labelTags: string[] = [];
      if (labelResult.items.length > 0 && labelResult.items[0].labelTags) {
        labelTags = Array.isArray(labelResult.items[0].labelTags)
          ? labelResult.items[0].labelTags.filter(tag => tag && typeof tag === 'string')
          : [];
      }

      return {
        success: true,
        data: labelTags,
        debug: {
          email: trimmedEmail,
          labelTags,
          labelRecordFound: labelResult.items.length > 0,
          labelRecordInfo: labelResult.items[0] || null
        }
      };
    } catch (error) {
      console.error('Error fetching labels by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: { email, error }
      };
    }
  }
);

// Get contact labels (from Notes collection - LEGACY for backward compatibility)
export const getContactLabels = webMethod(
  Permissions.Anyone,
  async (submissionId: string): Promise<BackendResponse<string[]>> => {
    try {
      console.log('Fetching labels for contact from Notes:', submissionId);

      const noteResult = await items.query("Notes")
        .eq("submissionId", submissionId)
        .limit(1)
        .find();

      console.log('Note details:', noteResult);

      let labelTags: string[] = [];
      if (noteResult.items.length > 0 && noteResult.items[0].labelTags) {
        labelTags = Array.isArray(noteResult.items[0].labelTags)
          ? noteResult.items[0].labelTags.filter(tag => tag && typeof tag === 'string')
          : [];
      }

      return {
        success: true,
        data: labelTags,
        debug: {
          submissionId,
          labelTags,
          noteFound: noteResult.items.length > 0,
          noteInfo: noteResult.items[0] || null
        }
      };
    } catch (error) {
      console.error('Error fetching contact labels:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: { submissionId, error }
      };
    }
  }
);

// Get labels for multiple emails in batch (for performance)
export const getBatchLabelsByEmails = webMethod(
  Permissions.Anyone,
  async (emails: string[]): Promise<BackendResponse<{ [email: string]: string[] }>> => {
    try {
      console.log('Fetching labels for multiple emails from Labels collection:', emails);

      if (!emails || emails.length === 0) {
        return {
          success: true,
          data: {},
          debug: {
            emails: [],
            message: 'No emails provided, returning empty results'
          }
        };
      }

      // Filter out empty emails and trim
      const validEmails = emails.filter(email => email && email.trim() !== '').map(email => email.trim());

      if (validEmails.length === 0) {
        return {
          success: true,
          data: {},
          debug: {
            emails: validEmails,
            message: 'No valid emails provided, returning empty results'
          }
        };
      }

      // Query Labels collection for all emails at once
      const labelResults = await items.query("Labels")
        .hasSome("email", validEmails)
        .limit(1000)
        .find();

      console.log('Batch label results:', labelResults);

      // Build the result object
      const emailToLabels: { [email: string]: string[] } = {};

      // Initialize all emails with empty arrays
      validEmails.forEach(email => {
        emailToLabels[email] = [];
      });

      // Fill in the actual labels
      labelResults.items.forEach((labelRecord: any) => {
        if (labelRecord.email && labelRecord.labelTags && Array.isArray(labelRecord.labelTags)) {
          const validLabels = labelRecord.labelTags.filter((tag: any) => tag && typeof tag === 'string');
          emailToLabels[labelRecord.email] = validLabels;
        }
      });

      return {
        success: true,
        data: emailToLabels,
        debug: {
          emails: validEmails,
          totalEmailsRequested: validEmails.length,
          labelRecordsFound: labelResults.items.length,
          emailsWithLabels: Object.keys(emailToLabels).filter(email => emailToLabels[email].length > 0).length
        }
      };
    } catch (error) {
      console.error('Error fetching batch labels by emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: { emails, error }
      };
    }
  }
);

// Create a new label (simple return since we're using tags)
export const findOrCreateLabel = webMethod(
  Permissions.Anyone,
  async (displayName: string): Promise<BackendResponse<Label>> => {
    try {
      console.log('Creating label tag:', displayName);

      if (!displayName || displayName.trim().length === 0) {
        return {
          success: false,
          error: 'Label name is required'
        };
      }

      const trimmedName = displayName.trim();

      const label: Label = {
        key: trimmedName,
        displayName: trimmedName,
        labelType: 'USER_DEFINED'
      };

      return {
        success: true,
        data: label,
        debug: {
          displayName: trimmedName,
          wasNewLabel: true,
          message: 'Label created as tag (will be persisted when assigned to contact)'
        }
      };
    } catch (error) {
      console.error('Error creating label:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          displayName,
          error,
          errorType: error?.constructor?.name,
          errorDetails: JSON.stringify(error, null, 2)
        }
      };
    }
  }
);

// Remove specific labels from a contact (same pattern as notes system)
export const removeLabelsFromContact = webMethod(
  Permissions.Anyone,
  async (submissionId: string, email: string, name: string, labelsToRemove: string[]): Promise<BackendResponse> => {
    try {
      console.log('Removing labels from contact via Notes:', { submissionId, email, name, labelsToRemove });

      if (!submissionId || !labelsToRemove || labelsToRemove.length === 0) {
        return {
          success: false,
          error: 'SubmissionId and labelsToRemove are required'
        };
      }

      // Find existing note for this submission
      const existingNote = await items.query("Notes")
        .eq("submissionId", submissionId)
        .limit(1)
        .find();

      if (existingNote.items.length === 0) {
        return {
          success: true,
          data: null,
          debug: {
            submissionId,
            message: 'No note found, nothing to remove'
          }
        };
      }

      const note = existingNote.items[0];
      const currentLabels = Array.isArray(note.labelTags) ? note.labelTags : [];

      // Filter out the labels to remove
      const updatedLabels = currentLabels.filter(label =>
        !labelsToRemove.includes(label)
      );

      // Update the note with filtered labels (preserve existing notes and other fields)
      const result = await items.update("Notes", {
        _id: note._id,
        submissionId,
        email: email,
        name: name,
        notes: note.notes || '', // Preserve existing notes
        labelTags: updatedLabels
      });

      console.log('Labels removed successfully:', result);

      return {
        success: true,
        data: result,
        debug: {
          submissionId,
          email,
          name,
          labelsToRemove,
          originalLabels: currentLabels,
          updatedLabels,
          removedCount: currentLabels.length - updatedLabels.length
        }
      };
    } catch (error) {
      console.error('Error removing labels from contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: { submissionId, email, name, labelsToRemove, error }
      };
    }
  }
);