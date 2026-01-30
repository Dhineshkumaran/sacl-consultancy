import { apiService } from './commonService';
import { trialCardSchema } from '../schemas/trialCard';
import { validate } from '../utils';

export const trialService = {
    /**
     * Fetches the master list of parts/patterns
     * @returns Promise resolving to array of master list items
     */
    async getMasterList(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async getMasterListByPatternCode(patternCode: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async getTrialIdByPartName(partName: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async getTrialByTrialId(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async submitTrial(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(trialCardSchema, payload);
            return await apiService.request('/trial', {
                method: 'POST',
                body: JSON.stringify(validatedData)
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
    async getAllTrials(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async getAllTrialReports(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/trial-reports');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trial reports:', error);
            throw error;
        }
    },

    /**
     * Fetches all trial reports
     * @returns Promise resolving to array of all trial reports
     */
    async getRecentTrialReports(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/recent-trial-reports');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch recent trial reports:', error);
            throw error;
        }
    },

    /**
     * Fetches trial by ID (alias for getTrialByTrialId)
     * @param trialId - Trial ID to fetch
     * @returns Promise resolving to trial data
     */
    async getTrialById(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    async updateTrial(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(trialCardSchema.partial(), payload);
            return await apiService.request('/trial/update', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
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
    async deleteTrialReport(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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

    /**
     * Fetches all consolidated reports
     * @returns Promise resolving to array of consolidated reports
     */
    async getConsolidatedReports(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/consolidated-reports');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch consolidated reports:', error);
            throw error;
        }
    },

    /**
     * Fetches all soft-deleted trial reports
     * @returns Promise resolving to array of deleted trial reports
     */
    async getDeletedTrialReports(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/deleted-reports');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch deleted trial reports:', error);
            throw error;
        }
    },

    /**
     * Restores a soft-deleted trial report
     * @param trialId - Trial ID to restore
     * @returns Promise resolving to API response
     */
    async restoreTrialReport(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/restore-report', {
                method: 'POST',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to restore trial report:', error);
            throw error;
        }
    },

    /**
     * Permanently deletes a trial report
     * @param trialId - Trial ID to permanently delete
     * @returns Promise resolving to API response
     */
    async permanentlyDeleteTrialReport(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/permanent-delete-report', {
                method: 'DELETE',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to permanently delete trial report:', error);
            throw error;
        }
    },

    /**
     * Fetches trials that are in progress
     * @returns Promise resolving to array of progressing trials
     */
    async getProgressingTrials(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/progressing');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch progressing trials:', error);
            throw error;
        }
    },

    /**
     * Soft deletes a trial card
     * @param trialId - Trial ID to delete
     * @returns Promise resolving to API response
     */
    async deleteTrialCard(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/delete-trial', {
                method: 'DELETE',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to delete trial card:', error);
            throw error;
        }
    },

    /**
     * Bulk soft deletes trial cards
     * @param trialIds - Array of trial IDs to delete
     * @returns Promise resolving to API response
     */
    async bulkDeleteTrialCards(trialIds: string[]): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/delete-trial', {
                method: 'DELETE',
                body: JSON.stringify({ trial_id: trialIds })
            });
        } catch (error) {
            console.error('Failed to bulk delete trial cards:', error);
            throw error;
        }
    },

    /**
     * Fetches all soft-deleted trial cards
     * @returns Promise resolving to array of deleted trial cards
     */
    async getDeletedTrialCards(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const data = await apiService.request('/trial/deleted-trials');
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch deleted trial cards:', error);
            throw error;
        }
    },

    /**
     * Restores a soft-deleted trial card
     * @param trialId - Trial ID to restore
     * @returns Promise resolving to API response
     */
    async restoreTrialCard(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/restore-trial', {
                method: 'POST',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to restore trial card:', error);
            throw error;
        }
    },

    /**
     * Permanently deletes a trial card
     * @param trialId - Trial ID to permanently delete
     * @returns Promise resolving to API response
     */
    async permanentlyDeleteTrialCard(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request('/trial/permanent-delete-trial', {
                method: 'DELETE',
                body: JSON.stringify({ trial_id: trialId })
            });
        } catch (error) {
            console.error('Failed to permanently delete trial card:', error);
            throw error;
        }
    },
};
