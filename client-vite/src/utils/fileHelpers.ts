import type { FileMetadata } from '../types/inspection';
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Converts a File object to metadata object
 * @param file - File object or null
 * @returns File metadata or null
 */
export const fileToMeta = (file: File | null): FileMetadata | null => {
    if (!file) return null;

    return {
        name: file.name,
        size: file.size,
        type: file.type,
    };
};

/**
 * Converts multiple files to metadata array
 * @param files - Array of File objects
 * @returns Array of file metadata
 */
export const filesToMeta = (files: File[]): FileMetadata[] => {
    return files.map(fileToMeta).filter((meta): meta is FileMetadata => meta !== null);
};

/**
 * Formats file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validates if file type is allowed
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 */
export const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.some(type => {
        if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
        }
        return file.type === type;
    });
};

/**
 * Validates if file size is within allowed limit
 * @param file - File to validate
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateFileSize = (
    file: File,
    maxSize: number = MAX_FILE_SIZE
): { isValid: boolean; error?: string } => {
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxSize)}.`
        };
    }
    return { isValid: true };
};

/**
 * Validates multiple files for size limit
 * @param files - Array of files to validate
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 * @returns Object with isValid boolean and array of error messages
 */
export const validateFileSizes = (
    files: File[],
    maxSize: number = MAX_FILE_SIZE
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    files.forEach(file => {
        const result = validateFileSize(file, maxSize);
        if (!result.isValid && result.error) {
            errors.push(result.error);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Converts a File to a Base64 string
 * @param file - File object
 * @returns Promise resolving to Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};