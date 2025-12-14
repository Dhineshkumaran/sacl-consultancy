const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const documentService = {
    async uploadDocument(trial_id: string, document_type: string, file_name: string, file_base64: string, uploaded_by: string, uploaded_at: string, remarks: string) {
        const body = {
            "trial_id": trial_id,
            "document_type": document_type,
            "file_name": file_name,
            "file_base64": file_base64,
            "uploaded_by": uploaded_by,
            "uploaded_at": uploaded_at,
            "remarks": remarks
        };
        const response = await fetch(`${API_BASE}/documents`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem('authToken') || ''
            },
        });
        return response;
    },

    async getDocument(trial_id: string) {
        const response = await fetch(`${API_BASE}/documents?trial_id=${trial_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('authToken') || ''
            },
        });
        return response;
    }
};