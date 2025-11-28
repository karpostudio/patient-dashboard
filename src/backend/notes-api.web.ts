import { webMethod, Permissions } from '@wix/web-methods';
import { items } from '@wix/data';

interface Note {
  _id: string;
  submissionId: string;
  email: string;
  name: string;
  notes: string;
  _createdDate: string;
  _updatedDate: string;
}

interface BackendResponse<T = any> {
  success: boolean;
  error?: string;
  note?: T;
  debug?: any;
}

// Helper function to convert Date to string
const toDateString = (date: string | Date | undefined): string => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return date.toISOString();
};

// Get note for submission
export const getNoteForSubmission = webMethod(
  Permissions.Anyone,
  async (submissionId: string): Promise<BackendResponse<Note>> => {
    try {
      const results = await items.query("Notes")
        .eq("submissionId", submissionId)
        .limit(1)
        .find();

      // Convert WixDataItem to Note or return null
      const foundItem = results.items.length > 0 ? results.items[0] : null;
      const note: Note | null = foundItem ? {
        _id: foundItem._id || '',
        submissionId: foundItem.submissionId || '',
        email: foundItem.email || '',
        name: foundItem.name || '',
        notes: foundItem.notes || '',
        _createdDate: toDateString(foundItem._createdDate),
        _updatedDate: toDateString(foundItem._updatedDate)
      } : null;

      return {
        success: true,
        note: note || undefined
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

// Update note
export const saveNote = webMethod(
  Permissions.Anyone,
  async (submissionId: string, email: string, name: string, noteText: string, noteId?: string | null): Promise<BackendResponse<Note>> => {
    try {

      if (noteId) {
        // Update existing note
        const toUpdate = {
          _id: noteId,
          submissionId,
          email,
          name,
          notes: noteText
        };

        const updatedItem = await items.update("Notes", toUpdate);

        // Convert updated item to Note
        const note: Note = {
          _id: updatedItem._id || '',
          submissionId: updatedItem.submissionId || submissionId,
          email: updatedItem.email || email,
          name: updatedItem.name || name,
          notes: updatedItem.notes || noteText,
          _createdDate: toDateString(updatedItem._createdDate),
          _updatedDate: toDateString(updatedItem._updatedDate)
        };

        return { success: true, note };
      } else {
        // Create new note (this shouldn't happen since notes should already exist)
        const newItem = {
          submissionId,
          email,
          name,
          notes: noteText
        };

        const insertedItem = await items.insert("Notes", newItem);

        // Convert inserted item to Note
        const note: Note = {
          _id: insertedItem._id || '',
          submissionId: insertedItem.submissionId || submissionId,
          email: insertedItem.email || email,
          name: insertedItem.name || name,
          notes: insertedItem.notes || noteText,
          _createdDate: toDateString(insertedItem._createdDate),
          _updatedDate: toDateString(insertedItem._updatedDate)
        };

        return { success: true, note };
      }
    } catch (error) {
      console.error('Error saving note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

// Optional: Add a method to get all notes for debugging
export const getAllNotes = webMethod(
  Permissions.Anyone,
  async (): Promise<BackendResponse<Note[]>> => {
    try {
      const results = await items.query("Notes")
        .limit(100)
        .find();

      // Convert all items to Notes
      const notes: Note[] = results.items.map(item => ({
        _id: item._id || '',
        submissionId: item.submissionId || '',
        email: item.email || '',
        name: item.name || '',
        notes: item.notes || '',
        _createdDate: toDateString(item._createdDate),
        _updatedDate: toDateString(item._updatedDate)
      }));

      return {
        success: true,
        note: notes
      };
    } catch (error) {
      console.error('Error fetching all notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);