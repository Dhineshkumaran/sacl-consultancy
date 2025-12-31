const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const masterListService = {
  submitMasterListJson(payload: Record<string, unknown>) {
    return fetch(`${API_BASE}/master-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
      body: JSON.stringify(payload),
    });
  },

  submitMasterListFormData(payload: Record<string, unknown>, attachments: File[]) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    attachments.forEach((file) => {
      formData.append('attachments', file, file.name);
    });

    return fetch(`${API_BASE}/master-list`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('authToken') || ''
      },
      body: formData,
    });
  },

  getAllMasterLists() {
    return fetch(`${API_BASE}/master-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authToken') || ''
      }
    });
  },

  updateMasterList(id: string | number, payload: Record<string, unknown>) {
    return fetch(`${API_BASE}/master-list/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authToken') || ''
      },
      body: JSON.stringify(payload)
    });
  },

  deleteMasterLists(ids: number[]) {
    return fetch(`${API_BASE}/master-list/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authToken') || ''
      },
      body: JSON.stringify({ ids })
    });
  }
};

