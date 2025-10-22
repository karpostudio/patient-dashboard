import { webMethod, Permissions } from '@wix/web-methods';
import { items } from '@wix/data';

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

interface BackendResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  debug?: any;
}

// Get all unique labels from Notes collection
export const listLabels = webMethod(
  Permissions.Anyone,
  async (): Promise<BackendResponse<Label[]>> => {
    try {
      console.log('Fetching all unique labels from Notes collection...');

      const notesResult = await items.query("Notes")
        .limit(1000)
        .find();

      console.log('Notes query result:', notesResult);

      // Extract all unique labels from all notes
      const allLabels = new Set<string>();
      notesResult.items.forEach((note: any) => {
        if (note.labelTags && Array.isArray(note.labelTags)) {
          note.labelTags.forEach((tag: any) => {
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
          notesWithLabels: notesResult.items.filter((note: any) => note.labelTags && Array.isArray(note.labelTags) && note.labelTags.length > 0).length,
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

// Assign labels to a contact (via Notes collection, same pattern as notes)
export const assignLabelsToContact = webMethod(
  Permissions.Anyone,
  async (submissionId: string, email: string, name: string, labelTags: string[]): Promise<BackendResponse> => {
    try {
      console.log('Assigning labels to contact via Notes:', { submissionId, email, name, labelTags });

      if (!submissionId) {
        return {
          success: false,
          error: 'SubmissionId is required'
        };
      }

      // Find existing note for this submission (same logic as notes system)
      const existingNote = await items.query("Notes")
        .eq("submissionId", submissionId)
        .limit(1)
        .find();

      let result;

      if (existingNote.items.length > 0) {
        // Update existing note with new labels (preserve existing notes and other fields)
        const noteItem = existingNote.items[0];
        result = await items.update("Notes", {
          _id: noteItem._id,
          submissionId,
          email: email,
          name: name,
          notes: noteItem.notes || '', // Preserve existing notes
          labelTags: labelTags
        });
        console.log('Updated existing note with labels:', result);
      } else {
        // Create new note with labels (same pattern as notes system)
        result = await items.insert("Notes", {
          submissionId: submissionId,
          email: email,
          name: name,
          notes: '',
          labelTags: labelTags
        });
        console.log('Created new note with labels:', result);
      }

      return {
        success: true,
        data: result,
        debug: {
          submissionId,
          email,
          name,
          labelTags,
          noteId: result._id,
          wasUpdate: existingNote.items.length > 0
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

// Get contact labels (from Notes collection)
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