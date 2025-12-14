/**
 * Inspection Service
 * Handles API calls for all inspection types (Metallurgical, Visual, Dimensional, etc.)
 */

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const inspectionService = {
    /**
     * Submits metallurgical inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitMetallurgicalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/metallurgical-inspection`, {
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
                throw new Error(data.message || 'Failed to submit metallurgical inspection');
            }

            return data;
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
    async submitVisualInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/visual-inspection`, {
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
                throw new Error(data.message || 'Failed to submit visual inspection');
            }

            return data;
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
    async submitDimensionalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/dimensional-inspection`, {
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
                throw new Error(data.message || 'Failed to submit dimensional inspection');
            }

            return data;
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
    async submitMachineShopInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/machine-shop`, {
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
                throw new Error(data.message || 'Failed to submit machine shop inspection');
            }

            return data;
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
    async submitPouringDetails(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/pouring-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
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
    async submitSandProperties(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/sand-properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
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
    async submitMouldingCorrection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/moulding-correction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to save mould correction');
            }

            return data;
        } catch (error) {
            console.error('Error submitting moulding correction:', error);
            throw error;
        }
    },

    // Sand Properties
    async getSandProperties(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/sand-properties/trial_id?trial_id=${trialId}`, {
                headers: { 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching sand properties:', error); throw error; }
    },
    async updateSandProperties(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/sand-properties`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update sand properties');
            return data;
        } catch (error) { console.error('Error updating sand properties:', error); throw error; }
    },

    // Moulding Correction
    async getMouldingCorrection(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/moulding-correction/trial_id?trial_id=${trialId}`, {
                headers: { 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching moulding correction:', error); throw error; }
    },
    async updateMouldingCorrection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/moulding-correction`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update moulding correction');
            return data;
        } catch (error) { console.error('Error updating moulding correction:', error); throw error; }
    },

    // Visual Inspection
    async getVisualInspection(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/visual-inspection/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching visual inspection:', error); throw error; }
    },
    async updateVisualInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/visual-inspection`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update visual inspection');
            return data;
        } catch (error) { console.error('Error updating visual inspection:', error); throw error; }
    },

    // Dimensional Inspection
    async getDimensionalInspection(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/dimensional-inspection/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching dimensional inspection:', error); throw error; }
    },
    async updateDimensionalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/dimensional-inspection`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update dimensional inspection');
            return data;
        } catch (error) { console.error('Error updating dimensional inspection:', error); throw error; }
    },

    // Metallurgical Inspection
    async getMetallurgicalInspection(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/metallurgical-inspection/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching metallurgical inspection:', error); throw error; }
    },
    async updateMetallurgicalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/metallurgical-inspection`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update metallurgical inspection');
            return data;
        } catch (error) { console.error('Error updating metallurgical inspection:', error); throw error; }
    },

    // Pouring Details
    async getPouringDetails(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/pouring-details/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching pouring details:', error); throw error; }
    },
    async updatePouringDetails(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/pouring-details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update pouring details');
            return data;
        } catch (error) { console.error('Error updating pouring details:', error); throw error; }
    },

    // Machine Shop
    async getMachineShopInspection(trialId: string): Promise<any> {
        try {
            // Machine shop might not have specific route in list, deducing from post route
            const response = await fetch(`${API_BASE}/machine-shop/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching machine shop inspection:', error); throw error; }
    },
    async updateMachineShopInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/machine-shop`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update machine shop inspection');
            return data;
        } catch (error) { console.error('Error updating machine shop inspection:', error); throw error; }
    },
    // Material Correction
    async submitMaterialCorrection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/material-correction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit material correction');
            }

            return data;
        } catch (error) {
            console.error('Error submitting material correction:', error);
            throw error;
        }
    },

    async getMaterialCorrection(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/material-correction/trial_id?trial_id=${trialId}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }
            });
            return await response.json();
        } catch (error) { console.error('Error fetching material correction:', error); throw error; }
    },

    async updateMaterialCorrection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/material-correction`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update material correction');
            return data;
        } catch (error) { console.error('Error updating material correction:', error); throw error; }
    },

    /**
     * Fetches all department data for a given trial ID
     * @param trialId - The trial ID to fetch data for
     * @returns Promise resolving to API response with all data
     */
    async getAllDepartmentData(trialId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/get-all-department-data?trial_id=${trialId}`, {
                headers: { 'Authorization': localStorage.getItem('authToken') || '' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch all department data');
            return data;
        } catch (error) {
            console.error('Error fetching all department data:', error);
            throw error;
        }
    }
};
