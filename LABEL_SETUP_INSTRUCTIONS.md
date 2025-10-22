# Label Setup Instructions

## Database Setup Required

To enable the label functionality, you need to add a new field to your **Notes** collection in the Wix Database:

### Steps:

1. **Go to Wix Editor** → **Database** → **Notes Collection**

2. **Add New Field:**
   - **Field Name:** `labelTags`
   - **Field Type:** `Array`
   - **Array Item Type:** `Text`
   - **Required:** No (Optional)

3. **Field Settings:**
   - **Display Name:** "Label Tags"
   - **Description:** "Array of label tags assigned to this contact"
   - **Permissions:** Read/Write for Site Members

### Field Structure:
```
labelTags: string[]
```

Example data:
```json
{
  "_id": "note123",
  "submissionId": "patient456",
  "email": "patient@example.com",
  "name": "John Doe",
  "notes": "Patient notes...",
  "labelTags": ["VIP", "Follow-up", "Urgent"]
}
```

## Integration with Notes System:

🔗 **Perfect Integration:** The label system works exactly like your existing notes system:

- **Same Notes Row:** Labels are stored in the same row as patient notes
- **Same Identification:** Uses `submissionId`, `email`, and `name` to identify contacts
- **Preserves Notes:** When updating labels, existing notes are preserved
- **Auto-Creation:** If no Notes row exists, one is created (just like notes system)

### Data Flow:
1. **Patient Action:** Click "Label setzen" on a patient
2. **Find/Create Note:** System finds existing Notes row or creates new one
3. **Store Labels:** Updates `labelTags` field with selected labels
4. **Preserve Data:** Keeps existing `notes`, `email`, `name`, `submissionId`

## What This Enables:

1. **✅ Label Creation:** Create new labels by typing and clicking "Erstellen"
2. **✅ Label Assignment:** Assign multiple labels to contacts via checkboxes
3. **✅ Label Discovery:** All unique labels are automatically discovered from existing Notes
4. **✅ Label Removal:** Remove specific labels from contacts
5. **✅ Perfect Integration:** Labels and notes work together seamlessly
6. **✅ Same Data Row:** One Notes row per patient contains both notes AND labels

## How It Works:

- **Same Row Strategy:** Labels use the exact same Notes row as patient notes
- **Contact Identification:** Uses patient `submissionId` + `email` + `name` (same as notes)
- **Available Labels:** Discovered by scanning all Notes records for unique `labelTags`
- **No Conflicts:** Notes and labels coexist perfectly in the same database row
- **Automatic Cleanup:** Unused labels disappear when no longer assigned to any contact

## Benefits:

✅ **Unified Data Model:** Notes and labels in one place
✅ **No Additional Tables:** Uses existing Notes collection
✅ **Consistent Logic:** Same patterns as proven notes system
✅ **Data Integrity:** One source of truth per patient
✅ **Simple Maintenance:** Manage notes and labels together

Once you add this field to your Notes collection, the label feature will work immediately and integrate perfectly with your existing notes!