import { useState, useCallback } from 'react';
import { items } from '@wix/data';

export interface Note {
    _id: string;
    submissionId: string;
    email: string;
    name: string;
    notes: string;
    labelTags?: string[];
    _createdDate: string;
    _updatedDate: string;
}

export const useNotes = () => {
    const [notes, setNotes] = useState<{ [submissionId: string]: Note }>({});
    const [loadingNotes, setLoadingNotes] = useState<{ [submissionId: string]: boolean }>({});

    // Helper function to convert Date to string
    const toDateString = (date: string | Date | undefined): string => {
        if (!date) return new Date().toISOString();
        if (typeof date === 'string') return date;
        return date.toISOString();
    };

    const loadNoteForSubmission = useCallback(async (submissionId: string, email: string, name: string) => {
        if (notes[submissionId] || loadingNotes[submissionId]) {
            return notes[submissionId] || null;
        }

        setLoadingNotes(prev => ({ ...prev, [submissionId]: true }));

        try {
            console.log('🔍 Loading note for submission:', submissionId);

            // Query the Notes collection directly
            const results = await items.query("Notes")
                .eq("submissionId", submissionId)
                .limit(1)
                .find();

            console.log('📋 Query results:', results);

            if (results.items.length > 0) {
                const foundItem = results.items[0];
                console.log('✅ Found note item:', foundItem);

                // Convert to Note interface
                const note: Note = {
                    _id: foundItem._id || '',
                    submissionId: foundItem.submissionId || submissionId,
                    email: foundItem.email || email,
                    name: foundItem.name || name,
                    notes: foundItem.notes || '',
                    labelTags: foundItem.labelTags || [],
                    _createdDate: toDateString(foundItem._createdDate),
                    _updatedDate: toDateString(foundItem._updatedDate)
                };

                setNotes(prev => ({ ...prev, [submissionId]: note }));
                console.log('📝 Note loaded:', note);
                return note;
            } else {
                console.log('❌ No note found for submission:', submissionId);
                // Create empty note structure
                const emptyNote: Note = {
                    _id: '',
                    submissionId,
                    email,
                    name,
                    notes: '',
                    labelTags: [],
                    _createdDate: new Date().toISOString(),
                    _updatedDate: new Date().toISOString()
                };
                setNotes(prev => ({ ...prev, [submissionId]: emptyNote }));
                return emptyNote;
            }
        } catch (error) {
            console.error(`❌ Error loading note for submission ${submissionId}:`, error);
            return null;
        } finally {
            setLoadingNotes(prev => ({ ...prev, [submissionId]: false }));
        }
    }, [notes, loadingNotes]);

    const saveNote = useCallback(async (submissionId: string, noteText: string) => {
        setLoadingNotes(prev => ({ ...prev, [submissionId]: true }));

        try {
            console.log('💾 Saving note for submission:', submissionId, 'with text:', noteText);

            const currentNote = notes[submissionId];
            if (!currentNote) {
                console.error('❌ No note found to update');
                return false;
            }

            if (currentNote._id) {
                // Update existing note
                const updatedItem = await items.update("Notes", {
                    _id: currentNote._id,
                    submissionId,
                    email: currentNote.email,
                    name: currentNote.name,
                    notes: noteText
                });

                console.log('✅ Note updated:', updatedItem);

                // Update local state
                const updatedNote: Note = {
                    ...currentNote,
                    notes: noteText,
                    _updatedDate: toDateString(updatedItem._updatedDate)
                };

                setNotes(prev => ({ ...prev, [submissionId]: updatedNote }));
                return true;
            } else {
                // Create new note
                const newItem = await items.insert("Notes", {
                    submissionId,
                    email: currentNote.email,
                    name: currentNote.name,
                    notes: noteText
                });

                console.log('✅ Note created:', newItem);

                // Update local state
                const newNote: Note = {
                    _id: newItem._id || '',
                    submissionId,
                    email: currentNote.email,
                    name: currentNote.name,
                    notes: noteText,
                    _createdDate: toDateString(newItem._createdDate),
                    _updatedDate: toDateString(newItem._updatedDate)
                };

                setNotes(prev => ({ ...prev, [submissionId]: newNote }));
                return true;
            }
        } catch (error) {
            console.error(`❌ Error saving note for submission ${submissionId}:`, error);
            return false;
        } finally {
            setLoadingNotes(prev => ({ ...prev, [submissionId]: false }));
        }
    }, [notes]);

    const updateNoteText = useCallback((submissionId: string, noteText: string) => {
        setNotes(prev => ({
            ...prev,
            [submissionId]: {
                ...prev[submissionId],
                notes: noteText
            }
        }));
    }, []);

    return {
        notes,
        loadingNotes,
        loadNoteForSubmission,
        saveNote,
        updateNoteText
    };
};