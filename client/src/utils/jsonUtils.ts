/**
 * Safely parses a JSON value.
 * If the input is already an object, it returns it as T.
 * If the input is null/undefined or a string that fails to parse, it returns the fallback.
 */
export function safeParse<T>(value: any, fallback: T): T;
export function safeParse<T>(value: any, fallback?: T | null): T | null;
export function safeParse<T>(value: any, fallback: any = null): any {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'object') {
        return value as T;
    }

    if (typeof value === 'string') {
        try {
            const trimmed = value.trim();
            if (!trimmed) return fallback;
            const parsed = JSON.parse(trimmed);
            return (parsed === null || parsed === undefined) ? fallback : parsed as T;
        } catch (error) {
            console.error('Error parsing JSON:', error, 'Value:', value);
            return fallback;
        }
    }

    return fallback;
}
