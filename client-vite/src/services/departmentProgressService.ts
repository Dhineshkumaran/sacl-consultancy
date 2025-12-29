export interface ProgressItem {
  trial_id: string;
  department_id: number;
  username: string;
  completed_at?: string | null;
  approval_status?: string | null;
  remarks?: string | null;
  part_name?: string;
  pattern_code?: string;
  disa?: string;
  date_of_sampling?: string;
  department_name?: string;
  status?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

async function handleResponse(res: Response) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
  if (!res.ok) {
    const msg = json?.message || res.statusText || "API error";
    throw new Error(msg);
  }
  return json;
}

export async function getProgress(username: string): Promise<ProgressItem[]> {
  const url = `${API_BASE}/department-progress/get-progress?username=${encodeURIComponent(username || "")}`;
  const res = await fetch(url, { method: "GET", headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }, credentials: "include" });
  const json = await handleResponse(res);
  return Array.isArray(json.data) ? json.data as ProgressItem[] : [];
}

export async function createDepartmentProgress(payload: {
  trial_id: string;
  department_id: number;
  username: string;
  current_form: string;
  completed_at?: string;
  approval_status?: string;
  remarks?: string;
}) {
  const url = `${API_BASE}/department-progress`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": localStorage.getItem("authToken") || '' },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateDepartment(payload: {
  trial_id: string;
  next_department_id: number;
  username: string;
  current_form: string;
  role: string;
  remarks: string;
}) {
  const url = `${API_BASE}/department-progress/update-department`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": localStorage.getItem("authToken") || '' },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateDepartmentRole(payload: {
  trial_id: string;
  current_department_id: number;
  username: string;
  role: string;
  remarks: string;
}) {
  const url = `${API_BASE}/department-progress/update-role`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": localStorage.getItem("authToken") || '' },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function approve(payload: {
  trial_id: string;
}) {
  const url = `${API_BASE}/department-progress/approve`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": localStorage.getItem("authToken") || '' },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getCompletedTrials(username: string): Promise<ProgressItem[]> {
  const url = `${API_BASE}/department-progress/get-completed-trials?username=${encodeURIComponent(username || "")}`;
  const res = await fetch(url, { method: "GET", headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' }, credentials: "include" });
  const json = await handleResponse(res);
  return Array.isArray(json.data) ? json.data as ProgressItem[] : [];
}

export default { getProgress, updateDepartment, updateDepartmentRole, createDepartmentProgress, approve, getCompletedTrials };