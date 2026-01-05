import { useState } from 'react';
import Swal from 'sweetalert2';
import type { AlertState } from '../types/inspection';

/**
 * Custom hook for managing alert messages
 * Uses SweetAlert2 for popups
 */
export function useAlert() {
    const [alert, setAlert] = useState<AlertState | null>(null);

    const showAlert = async (
        severity: AlertState['severity'],
        message: string,
        duration?: number
    ) => {
        // We are disabling the inline alert by not setting the state
        // setAlert({ severity, message, duration });

        if (severity === 'success') {
            return Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Data submitted successfully',
                confirmButtonColor: '#3085d6',
            });
        } else {
            return Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonColor: '#d33',
            });
        }
    };

    const clearAlert = () => {
        setAlert(null);
    };

    return { alert, showAlert, clearAlert };
}
