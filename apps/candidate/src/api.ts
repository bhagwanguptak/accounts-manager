import { JobPosting, Application, ApplicationStatus, User } from '@accuhire/shared';
import { CreateUserInput } from '@accuhire/shared';
import { ApplyApplicationInput } from '@accuhire/shared';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accuhire_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  getCurrentUser: async () => {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },
    deleteJob: async (jobId: string): Promise<void> => {
    const res = await fetch(`/api/jobs/deleteJob/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to delete job');
    }
  },

  saveAdminSettings: async (settings: any) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },
    verifyOtp: async (data: { identifier: string; otp: string, role: string }) => {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('OTP verification failed');
      }

      return res.json();
    },
  getCandidateProfile: async () => {
    const res = await fetch('/api/profile/candidate', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },
  updateCandidateProfile: async (payload: any) => {
    const res = await fetch('/api/profile/candidate', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Profile update failed:', res.status, text);
      throw new Error(text || 'Failed to update profile');
    }

    return res.json();
  },



  getAdminSettings: async () => {
    const res = await fetch('/api/admin/settings', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },


  login: async (credentials: { mobile?: string; email?: string; password?: string; role?: string }): Promise<{ user: User; token: string }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  sendOtp: async (params: { mobile?: string; email?: string }): Promise<boolean> => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to send OTP');
    return true;
  },
  resetPassword: async (data: { identifier: string; otp: string; newPassword: string }): Promise<boolean> => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to reset password');
    return true;
  },
    getRecruiterJobs: async () => {
    const res = await fetch('/api/jobs/recruiter', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recruiter jobs');
    return res.json();
  },

  getAdminJobs: async () => {
    const res = await fetch('/api/jobs/admin', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin jobs');
    return res.json();
  },

  getAllJobs: async (): Promise<JobPosting[]> => {
    const res = await fetch('/api/jobs', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },
  getAllApplications: async (): Promise<Application[]> => {
    const res = await fetch('/api/applications/apply', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },
  getCandidateApplications: async (): Promise<Application[]> => {
    const res = await fetch(`/api/applications/candidate`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },
getApplicationsByJob: async (jobId: string): Promise<Application[]> => {
  const res = await fetch(`/api/applications/job/${jobId}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
},

  updateJob: async (id: string, updates: Partial<JobPosting>) => {
    const res = await fetch(`/api/jobs/updateJob/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update job');
    return res.json();
  },
  updateApplicationStatus: async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    const res = await fetch(`/api/applications/statuses`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        applicationId,
        status,
      }),
    });

    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
  },

  findUser: async (params: { mobile?: string; email?: string }): Promise<User | null> => {
    const query = new URLSearchParams();
    if (params.mobile) query.append('mobile', params.mobile);
    if (params.email) query.append('email', params.email);
    
    const res = await fetch(`/api/users?${query.toString()}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return Array.isArray(data) ? (data[0] || null) : data;
  },
  createUser: async (user: CreateUserInput): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },
  createApplication: async (jobId: string, app: ApplyApplicationInput) => {
    const res = await fetch('/api/applications/apply', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ jobId, ...app }),
    });
    if (!res.ok) throw new Error('Failed to create application');
    return res.json();
  },
  withdrawApplication: async (applicationId: string, candidateId: string): Promise<boolean> => {
    const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.ok;
  },
  createJob: async (recruiterId: string, job: Omit<JobPosting, 'id' | 'createdAt'>): Promise<JobPosting> => {
    const res = await fetch('/api/jobs/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recruiterId, ...job }),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  }
};