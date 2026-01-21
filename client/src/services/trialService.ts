/**
 * Trial Management Service
 * Handles API calls related to trials, master lists, and sample cards
 */
/**
 * Trial Management Service
 * Handles API calls related to trials, master lists, and sample cards
 */
import { apiService } from './commonService';

export const trialService = {
    /**
     * Fetches the master list of parts/patterns
     * @returns Promise resolving to array of master list items
     */
    async getMasterList(): Promise<any[]> {
        try {
            const data = await apiService.request('/master-list');
            return data.data || data || [];
        } catch (error) {
            console.error('Failed to fetch master list:', error);
            throw error;
        }
    },

    /**
     * Fetches master list item by pattern code
     * @param patternCode - Pattern code to search for
     * @returns Promise resolving to master list item
     */
    async getMasterListByPatternCode(patternCode: string): Promise<any> {
        try {
            const data = await apiService.request(`/master-list/search?pattern_code=${encodeURIComponent(patternCode)}`);
            return data.data || null;
        } catch (error) {
            console.error('Failed to fetch master list item:', error);
            throw error;
        }
    },

    /**
     * Fetches trial information by part name
     * @param partName - Name of the part to search for
     * @returns Promise resolving to trial data
     */
    async getTrialIdByPartName(partName: string): Promise<any> {
        try {
            return await apiService.request(`/trial/id?part_name=${encodeURIComponent(partName)}`);
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
            const data = await apiService.request(`/trial/trial_id?trial_id=${encodeURIComponent(trialId)}`);
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
     * Submits trial data
     * @param payload - Trial data to submit
     * @returns Promise resolving to API response
     */
    async submitTrial(payload: any): Promise<any> {
        try {
            return await apiService.request('/trial', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Failed to submit trial :', error);
            throw error;
        }
    },

    /**
     * Fetches all trials
     * @returns Promise resolving to array of all trials
     */
    async getAllTrials(): Promise<any[]> {
        try {
            const data = await apiService.request('/trial');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trials:', error);
            throw error;
        }
    },

    /**
     * Fetches all trial reports
     * @returns Promise resolving to array of all trial reports
     */
    async getAllTrialReports(): Promise<any[]> {
        try {
            const data = await apiService.request('/trial/trial-reports');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trial reports:', error);
            throw error;
        }
    },

    /**
     * Fetches trial by ID (alias for getTrialByTrialId)
     * @param trialId - Trial ID to fetch
     * @returns Promise resolving to trial data
     */
    async getTrialById(trialId: string): Promise<any> {
        try {
            const data = await apiService.request(`/trial/trial_id?trial_id=${encodeURIComponent(trialId)}`);
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                return { success: true, data: data.data[0] };
            }
            return { success: false, data: null };
        } catch (error) {
            console.error('Failed to fetch trial by ID:', error);
            throw error;
        }
    },

    /**
     * Updates trial data
     * @param payload - Trial data to update
     * @returns Promise resolving to API response
     */
    async updateTrial(payload: any): Promise<any> {
        try {
            return await apiService.request('/trial/update', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Failed to update trial:', error);
            throw error;
        }
    },

    /**
     * Deletes multiple trial reports
     * @param trialIds - Array of trial IDs to delete
     * @returns Promise resolving to API response
     */
    async deleteTrialReport(trialId: string): Promise<any> {
        try {
            return await apiService.request('/trial/delete-reports', {
                method: 'DELETE',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to delete trial report:', error);
            throw error;
        }
    },
};
