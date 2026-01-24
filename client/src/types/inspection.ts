/**
 * Shared type definitions for inspection forms
 */

/**
 * Alert state for displaying success/error messages
 */
export interface AlertState {
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

/**
 * Row data structure for inspection tables
 */
export interface InspectionRow {
    id: string;
    label: string;
    values: string[];
    freeText?: string;
    total?: number | null;
}

/**
 * Metadata for file attachments
 */
export interface FileMetadata {
    name: string;
    size: number;
    type: string;
}

/**
 * Group metadata including remarks and attachments
 */
export interface GroupMetadata {
    remarks: string;
    attachment: File | null;
}

/**
 * Common inspection form state
 */
export interface InspectionFormState {
    saving: boolean;
    loading: boolean;
    previewMode: boolean;
    previewSubmitted: boolean;
    alert: AlertState | null;
}

/**
 * File upload result
 */
export interface UploadResult {
    fileName: string;
    success: boolean;
    error?: string;
}

/**
 * Preview payload base interface
 */
export interface PreviewPayload {
    created_at: string;
    inspection_date?: string;
    attachedFiles?: string[];
    additionalRemarks?: string;
    [key: string]: any; // Allow additional properties // eslint-disable-line @typescript-eslint/no-explicit-any
}
