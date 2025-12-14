/**
 * Trial Management Service
 * Handles API calls related to trials, master lists, and sample cards
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const trialService = {
    /**
     * Fetches the master list of parts/patterns
     * @returns Promise resolving to array of master list items
     */
    async getMasterList(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE}/master-list`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || data || [];
        } catch (error) {
            console.error('Failed to fetch master list:', error);
            throw error;
        }
    },

    /**
     * Fetches trial information by part name
     * @param partName - Name of the part to search for
     * @returns Promise resolving to trial data
     */
    async getTrialByPartName(partName: string): Promise<any> {
        try {
            const response = await fetch(
                `${API_BASE}/trial/id?part_name=${encodeURIComponent(partName)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include'
            }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch trial by part name:', error);
            throw error;
        }
    },

    /**
     * Fetches trial information by trial ID
     * @param trialId - Trial ID to search for
     * @returns Promise resolving to trial data
     */
    async getTrialByTrialId(trialId: string): Promise<any> {
        try {
            const response = await fetch(
                `${API_BASE}/trial/trial_id?trial_id=${encodeURIComponent(trialId)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include'
            }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                return data.data[0];
            }

            return null;
        } catch (error) {
            console.error('Failed to fetch trial by trial ID:', error);
            throw error;
        }
    },

    /**
     * Submits trial data for November
     * @param payload - Trial data to submit
     * @returns Promise resolving to API response
     */
    async submitTrialNovember(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/trial-november`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Failed to submit trial november:', error);
            throw error;
        }
    },

    /**
     * Fetches pending sample cards
     * @returns Promise resolving to array of pending cards
     */
    async getPendingSampleCards(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE}/pending-sample-cards`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pending cards');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch pending sample cards:', error);
            throw error;
        }
    },

    /**
     * Fetches all trials
     * @returns Promise resolving to array of all trials
     */
    async getAllTrials(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE}/trial`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trials:', error);
            throw error;
        }
    }
};