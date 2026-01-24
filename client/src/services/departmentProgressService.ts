import { apiService } from './commonService';

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

export async function getProgress(username: string, department_id: number): Promise<ProgressItem[]> {
  const data = await apiService.request(`/department-progress/get-progress?username=${encodeURIComponent(username || "")}&department_id=${department_id}`, {
    method: "GET"
  });
  return Array.isArray(data.data) ? data.data as ProgressItem[] : [];
}

export async function getCompletedTrials(username: string): Promise<ProgressItem[]> {
  const data = await apiService.request(`/department-progress/get-completed-trials?username=${encodeURIComponent(username || "")}`, {
    method: "GET"
  });
  return Array.isArray(data.data) ? data.data as ProgressItem[] : [];
}

export async function getProgressByTrialId(trial_id: string): Promise<ProgressItem[]> {
  const data = await apiService.request(`/department-progress/get-progress-by-trial-id?trial_id=${encodeURIComponent(trial_id)}`, {
    method: "GET"
  });
  return Array.isArray(data.data) ? data.data as ProgressItem[] : [];
}

export default { getProgress, getCompletedTrials, getProgressByTrialId };