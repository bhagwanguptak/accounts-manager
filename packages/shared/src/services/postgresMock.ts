import { User, JobPosting, Application, ApplicationStatus } from '../types';

let users: User[] = [];
let jobs: JobPosting[] = [];
let applications: Application[] = [];

export const DB = {
  findUserByMobile: (mobile: string): User | undefined => {
    return users.find(u => u.id === mobile);
  },

  signup: (user: User): User => {
    const existing = users.find(u => u.id === user.id);
    if (!existing) {
      users.push(user);
      return user;
    }
    return existing;
  },

  saveUser: (user: User): void => {
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) users.push(user);
    else users[idx] = user;
  },

  getJobs: (): JobPosting[] => jobs,

  getRecruiterJobs: (recruiterId: string): JobPosting[] => {
    return jobs.filter(job => job.recruiterId === recruiterId);
  },

  saveJob: (job: JobPosting): void => {
    jobs.push(job);
  },

  submitApplication: (application: Application): void => {
    applications.push(application);
  },

  getApplicationsByRequestor: (requestorId: string): Application[] => {
    return applications.filter(a => a.requestorId === requestorId);
  },

  getApplicationsByJob: (jobId: string): Application[] => {
    return applications.filter(a => a.jobId === jobId);
  },

  updateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus
  ): void => {
    const app = applications.find(a => a.id === applicationId);
    if (app) {
      app.applicationStatus = status;
    }
  }
  ,
  withdrawApplication: (applicationId: string): boolean => {
    const idx = applications.findIndex(a => a.id === applicationId);
    if (idx === -1) return false;
    applications.splice(idx, 1);
    return true;
  }
};
