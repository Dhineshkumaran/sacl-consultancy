import { apiService } from './commonService';
import {
    sandPropertiesSchema,
    pouringDetailsSchema,
    mouldCorrectionSchema,
    metallurgicalInspectionSchema,
    visualInspectionSchema,
    dimensionalInspectionSchema,
    machineShopSchema,
    materialCorrectionSchema
} from '../schemas/inspections';

import { validate } from '../utils';

export const inspectionService = {
    /**
     * Submits metallurgical inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitMetallurgicalInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(metallurgicalInspectionSchema, payload);
            return await apiService.request('/metallurgical-inspection', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });
        } catch (error) {
            console.error('Error submitting metallurgical inspection:', error);
            throw error;
        }
    },

    /**
     * Submits visual inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitVisualInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(visualInspectionSchema, payload);
            return await apiService.request('/visual-inspection', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });
        } catch (error) {
            console.error('Error submitting visual inspection:', error);
            throw error;
        }
    },

    /**
     * Submits dimensional inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitDimensionalInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(dimensionalInspectionSchema, payload);
            return await apiService.request('/dimensional-inspection', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });
        } catch (error) {
            console.error('Error submitting dimensional inspection:', error);
            throw error;
        }
    },

    /**
     * Submits machine shop inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitMachineShopInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(machineShopSchema, payload);
            return await apiService.request('/machine-shop', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });
        } catch (error) {
            console.error('Error submitting machine shop inspection:', error);
            throw error;
        }
    },

    /**
     * Submits pouring details data
     * @param payload - Pouring details payload
     * @returns Promise resolving to API response
     */
    async submitPouringDetails(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(pouringDetailsSchema, payload);
            const data = await apiService.request('/pouring-details', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to save pouring details');
            }

            return data;
        } catch (error) {
            console.error('Error saving pouring details:', error);
            throw error;
        }
    },

    /**
     * Submits sand properties data
     * @param payload - Sand properties payload
     * @returns Promise resolving to API response
     */
    async submitSandProperties(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(sandPropertiesSchema, payload);
            const data = await apiService.request('/sand-properties', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            if (!data?.success) {
                throw new Error(data?.message || 'Failed to submit sand properties');
            }

            return data;
        } catch (error) {
            console.error('Error submitting sand properties:', error);
            throw error;
        }
    },

    /**
     * Submits moulding correction data
     * @param payload - Moulding correction payload
     * @returns Promise resolving to API response
     */
    async submitMouldingCorrection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(mouldCorrectionSchema, payload);
            const data = await apiService.request('/moulding-correction', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            if (!data?.success) {
                throw new Error(data?.message || 'Failed to save mould correction');
            }

            return data;
        } catch (error) {
            console.error('Error submitting moulding correction:', error);
            throw error;
        }
    },

    // Sand Properties
    async getSandProperties(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/sand-properties/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching sand properties:', error); throw error; }
    },
    async updateSandProperties(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(sandPropertiesSchema.partial(), payload);
            return await apiService.request('/sand-properties', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating sand properties:', error); throw error; }
    },

    // Moulding Correction
    async getMouldingCorrection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/moulding-correction/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching moulding correction:', error); throw error; }
    },
    async updateMouldingCorrection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(mouldCorrectionSchema.partial(), payload);
            return await apiService.request('/moulding-correction', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating moulding correction:', error); throw error; }
    },

    // Visual Inspection
    async getVisualInspection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/visual-inspection/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching visual inspection:', error); throw error; }
    },
    async updateVisualInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(visualInspectionSchema.partial(), payload);
            return await apiService.request('/visual-inspection', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating visual inspection:', error); throw error; }
    },

    // Dimensional Inspection
    async getDimensionalInspection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/dimensional-inspection/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching dimensional inspection:', error); throw error; }
    },
    async updateDimensionalInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(dimensionalInspectionSchema.partial(), payload);
            return await apiService.request('/dimensional-inspection', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating dimensional inspection:', error); throw error; }
    },

    // Metallurgical Inspection
    async getMetallurgicalInspection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/metallurgical-inspection/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching metallurgical inspection:', error); throw error; }
    },
    async updateMetallurgicalInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(metallurgicalInspectionSchema.partial(), payload);
            return apiService.request('/metallurgical-inspection', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating metallurgical inspection:', error); throw error; }
    },

    // Pouring Details
    async getPouringDetails(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/pouring-details/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching pouring details:', error); throw error; }
    },
    async updatePouringDetails(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(pouringDetailsSchema.partial(), payload);
            return await apiService.request('/pouring-details', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating pouring details:', error); throw error; }
    },

    // Machine Shop
    async getMachineShopInspection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/machine-shop/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching machine shop inspection:', error); throw error; }
    },
    async updateMachineShopInspection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(machineShopSchema.partial(), payload);
            return await apiService.request('/machine-shop', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating machine shop inspection:', error); throw error; }
    },
    // Material Correction
    async submitMaterialCorrection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(materialCorrectionSchema, payload);
            return await apiService.request('/material-correction', {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });
        } catch (error) {
            console.error('Error submitting material correction:', error);
            throw error;
        }
    },

    async getMaterialCorrection(trialId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            return await apiService.request(`/material-correction/trial_id?trial_id=${trialId}`);
        } catch (error) { console.error('Error fetching material correction:', error); throw error; }
    },

    async updateMaterialCorrection(payload: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            const validatedData = validate(materialCorrectionSchema.partial(), payload);
            return await apiService.request('/material-correction', {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });
        } catch (error) { console.error('Error updating material correction:', error); throw error; }
    }
};
