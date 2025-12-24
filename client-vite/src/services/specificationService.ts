const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const specificationService = {
    /**
     * Submits metallurgical specifications
     * @param payload - { trial_id, chemical_composition, microstructure }
     */
    async submitMetallurgicalSpecs(payload: {
        trial_id: string;
        chemical_composition: any;
        microstructure: any;
    }) {
        try {
            const response = await fetch(`${API_BASE}/metallurgical-specs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit metallurgical specifications');
            }
            return data;
        } catch (error) {
            console.error('Error submitting metallurgical specifications:', error);
            throw error;
        }
    },

    /**
     * Submits mechanical properties
     * @param payload - Full mechanical properties object with snake_case keys
     */
    async submitMechanicalProperties(payload: {
        trial_id: string;
        tensile_strength: string;
        yield_strength: string;
        elongation: string;
        impact_strength_cold: string;
        impact_strength_room: string;
        hardness_surface: string;
        hardness_core: string;
        x_ray_inspection: string;
        mpi: string;
    }) {
        try {
            const response = await fetch(`${API_BASE}/mechanical-properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit mechanical properties');
            }
            return data;
        } catch (error) {
            console.error('Error submitting mechanical properties:', error);
            throw error;
        }
    },

    /**
     * Get metallurgical specifications by trial ID
     * @param trialId - The trial ID to fetch specs for
     */
    async getMetallurgicalSpecs(trialId: string) {
        try {
            const response = await fetch(`${API_BASE}/metallurgical-specs/by-trial?trial_id=${trialId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                }
            });

            const data = await response.json();
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(data.message || 'Failed to fetch metallurgical specifications');
            }
            return data.data;
        } catch (error) {
            console.error('Error fetching metallurgical specifications:', error);
            throw error;
        }
    },
    /**
     * Get mechanical properties by trial ID
     * @param trialId - The trial ID to fetch properties for
     */
    async getMechanicalProperties(trialId: string) {
        try {
            const response = await fetch(`${API_BASE}/mechanical-properties/by-trial?trial_id=${trialId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                }
            });

            const data = await response.json();
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(data.message || 'Failed to fetch mechanical properties');
            }
            return data.data;
        } catch (error) {
            console.error('Error fetching mechanical properties:', error);
            throw error;
        }
    }
};
