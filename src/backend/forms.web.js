import { webMethod, Permissions } from '@wix/web-methods';
import { submissions } from '@wix/forms';
import { auth } from '@wix/essentials';
import { files } from '@wix/media';
import { items } from '@wix/data';

// Create elevated updateSubmission function
const elevatedUpdateSubmission = auth.elevate(submissions.updateSubmission);

// Update form submission with elevation
export const updateFormSubmission = webMethod(
    Permissions.Anyone,
    async (submissionId, updateData) => {
        try {
            // Validate required fields
            if (!updateData.formId || updateData.formId.trim() === '') {
                throw new Error('FormId is missing or empty');
            }
            if (!updateData.revision || updateData.revision.trim() === '') {
                throw new Error('Revision is missing or empty');
            }

            // Use elevated updateSubmission
            const result = await elevatedUpdateSubmission(submissionId, updateData);

            return {
                success: true,
                submission: result
            };
        } catch (error) {
            console.error('Backend: Error updating submission:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Get all form submissions
export const getFormSubmissions = webMethod(
    Permissions.Anyone,
    async () => {
        try {
            const results = await auth.elevate(submissions.querySubmissionsByNamespace)()
                .eq("namespace", "wix.form_app.form")
                .descending("_createdDate")
                .limit(1000)
                .find();

            return {
                success: true,
                submissions: results.items,
                totalCount: results.totalCount
            };
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Delete a form submission
export const deleteFormSubmission = webMethod(
    Permissions.Anyone,
    async (submissionId) => {
        try {
            await auth.elevate(submissions.deleteSubmission)(submissionId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting submission:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Generate download URL for a file (used for signature files)
export const getSignatureDownloadUrl = webMethod(
    Permissions.Anyone,
    async (fileId) => {
        try {
            if (!fileId) {
                return {
                    success: false,
                    error: 'FileId is required'
                };
            }

            // Use elevated files API to generate download URL
            const elevatedGenerateUrl = auth.elevate(files.generateFileDownloadUrl);
            const result = await elevatedGenerateUrl(fileId);

            // Wix API returns { downloadUrls: [{ assetKey, url }] }
            const downloadUrl = result.downloadUrls?.[0]?.url;
            if (!downloadUrl) {
                return {
                    success: false,
                    error: 'No download URL returned from Wix API'
                };
            }

            return {
                success: true,
                downloadUrl
            };
        } catch (error) {
            // If elevation fails, try without elevation (for public files)
            try {
                const result = await files.generateFileDownloadUrl(fileId);
                // Wix API returns { downloadUrls: [{ assetKey, url }] }
                const downloadUrl = result.downloadUrls?.[0]?.url;
                if (!downloadUrl) {
                    return {
                        success: false,
                        error: 'No download URL returned from Wix API'
                    };
                }
                return {
                    success: true,
                    downloadUrl
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
    }
);

// Get cached signature from SignatureCache collection
export const getSignatureFromCache = webMethod(
    Permissions.Anyone,
    async (submissionId) => {
        try {
            if (!submissionId) {
                return { success: false, error: 'SubmissionId is required' };
            }

            const result = await items.query("SignatureCache")
                .eq("submissionId", submissionId)
                .limit(1)
                .find();

            if (result.items.length > 0 && result.items[0].signatureBase64) {
                return {
                    success: true,
                    signatureBase64: result.items[0].signatureBase64
                };
            }

            return { success: false, error: 'Signature not found in cache' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Save signature to SignatureCache collection
export const cacheSignature = webMethod(
    Permissions.Anyone,
    async (submissionId, signatureBase64) => {
        try {
            if (!submissionId || !signatureBase64) {
                return { success: false, error: 'SubmissionId and signatureBase64 are required' };
            }

            // Check if already cached
            const existing = await items.query("SignatureCache")
                .eq("submissionId", submissionId)
                .limit(1)
                .find();

            if (existing.items.length > 0) {
                // Update existing
                await items.update("SignatureCache", {
                    _id: existing.items[0]._id,
                    submissionId,
                    signatureBase64
                });
            } else {
                // Insert new
                await items.insert("SignatureCache", {
                    submissionId,
                    signatureBase64
                });
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);

// Fetch image from URL and convert to base64 (server-side to avoid CORS)
export const fetchSignatureAsBase64 = webMethod(
    Permissions.Anyone,
    async (imageUrl, submissionId) => {
        try {
            if (!imageUrl) {
                return { success: false, error: 'Image URL is required' };
            }

            // Fetch the image server-side (no CORS issues)
            const response = await fetch(imageUrl);

            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to fetch image: ${response.status} ${response.statusText}`
                };
            }

            // Get the image as array buffer
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Convert to base64
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = btoa(binary);

            // Get content type for data URL
            const contentType = response.headers.get('content-type') || 'image/png';
            const dataUrl = `data:${contentType};base64,${base64}`;

            // Cache it if submissionId provided
            if (submissionId) {
                try {
                    const existing = await items.query("SignatureCache")
                        .eq("submissionId", submissionId)
                        .limit(1)
                        .find();

                    if (existing.items.length > 0) {
                        await items.update("SignatureCache", {
                            _id: existing.items[0]._id,
                            submissionId,
                            signatureBase64: dataUrl
                        });
                    } else {
                        await items.insert("SignatureCache", {
                            submissionId,
                            signatureBase64: dataUrl
                        });
                    }
                } catch (cacheError) {
                    // Caching failed but we still have the base64
                    console.error('Failed to cache signature:', cacheError);
                }
            }

            return {
                success: true,
                signatureBase64: dataUrl
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
);