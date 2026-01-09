"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { User, JobPosting, Application, ApplicationStatus } from '../../../apps/candidate/src/types';
import Navbar from '../../../apps/candidate/src/components/Navbar';
import {logger} from '../../../apps/candidate/src/services/logger';
import {Toast} from '../../../apps/candidate/src/components/Toast';
import { api } from './api';


// Jobs count component
const JobsCount: React.FC = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchJobs = async () => {
      const jobs = await api.getAllJobs();
      setCount(jobs.length);
    };
    fetchJobs();
  }, []);
  return <p className="text-4xl font-black text-slate-900">{count}</p>;
};

// Recruiters count component
const RecruitersCount: React.FC = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchRecruiters = async () => {
      const jobs = await api.getAllJobs();
      setCount(new Set(jobs.map(j => j.recruiterId)).size);
    };
    fetchRecruiters();
  }, []);
  return <p className="text-4xl font-black text-slate-900">{count}</p>;
};

// Applications count component
const ApplicationsCount: React.FC = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchApps = async () => {
      const apps = await api.getAllApplications();
      setCount(apps.length);
    };
    fetchApps();
  }, []);
  return <p className="text-4xl font-black text-slate-900">{count}</p>;
};

// All jobs list component
const AllJobsList: React.FC<{ setSelectedJob: (job: JobPosting) => void, setEditingJob: (job: Partial<JobPosting>) => void, deleteJob: (jobId: string) => void }> = ({ setSelectedJob, setEditingJob, deleteJob }) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  useEffect(() => {
    const fetchJobs = async () => {
      const jobs = await api.getAllJobs();
      setJobs(jobs);
    };
    fetchJobs();
  }, []);
  return (
    <>
      {jobs.map(job => (
        <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
          <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-slate-900">{job.title}</h3>
              <p className="text-slate-600 font-bold text-sm mt-1">{job.company} • {job.location}</p>
              <p className="text-xs text-slate-400 mt-2">Posted: {new Date(job.createdAt).toLocaleDateString()}</p>
              {job.description && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{job.description}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedJob(job); setEditingJob({ ...job }); }}
                className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase hover:bg-blue-700 transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => deleteJob(job.id)}
                className="px-6 py-3 bg-red-600 text-white font-black rounded-2xl text-xs uppercase hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// All applications list component
const AllApplicationsList: React.FC<{ setSelectedApp: (app: Application) => void, setEditingApp: (app: Partial<Application>) => void }> = ({ setSelectedApp, setEditingApp }) => {
  const [apps, setApps] = useState<Application[]>([]);
  useEffect(() => {
    const fetchApps = async () => {
      const allApps = await api.getAllApplications();
      setApps(allApps);
    };
    fetchApps();
  }, []);
  return (
    <div className="grid grid-cols-1 gap-6">
      {apps.length > 0 ? (
        apps.map(app => (
          <div key={app.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-slate-900">{app.candidateName}</h3>
                <p className="text-slate-600 font-bold text-sm">{app.candidateMobile} • Status: <span className="text-blue-600">{app.applicationStatus}</span></p>
                <p className="text-xs text-slate-400 mt-2">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedApp(app); setEditingApp({ ...app }); }}
                  className="px-6 py-3 bg-green-600 text-white font-black rounded-2xl text-xs uppercase hover:bg-green-700 transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-slate-400 text-center py-20 font-black">No applications found</p>
      )}
    </div>
    
  );
  
};

// All recruiters list component
const AllRecruitersList: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  useEffect(() => {
    const fetchJobs = async () => {
      const allJobs = await api.getAllJobs();
      setJobs(allJobs);
    };
    fetchJobs();
  }, []);
  const recruiterMap = useMemo(() => new Map(jobs.map(job => [job.recruiterId, job])), [jobs]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from(recruiterMap.entries()).map(([recruiterId, firstJob]) => {
        const recruiterJobs = jobs.filter(j => j.recruiterId === recruiterId);
        return (
          <div key={recruiterId} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Recruiter ID: {recruiterId}</h3>
                <p className="text-xs text-slate-400 mt-1">System-assigned unique identifier</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Active Jobs</p>
                  <p className="text-2xl font-black text-blue-900">{recruiterJobs.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Applications</p>
                  <p className="text-2xl font-black text-purple-900">-</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-bold text-slate-600 mb-3">Latest Job</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">{firstJob.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{firstJob.company} • {firstJob.location}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Posted: {new Date(firstJob.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setToast(`Viewing ${recruiterJobs.length} jobs from this recruiter`);
                  setTimeout(() => setToast(''), 3000);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase hover:bg-blue-700 transition-all"
              >
                View All Jobs
              </button>
            </div>
          </div>
        );
      })}
      {recruiterMap.size === 0 && (
        <p className="text-slate-400 text-center py-20 font-black">No recruiters found</p>
      )}
    </div>
  );
};

const AdminApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
const [view, setView] = useState<'login' | 'dashboard' | 'jobs' | 'applications' | 'settings' | 'recruiters'>('login');
const [adminEmail, setAdminEmail] = useState('');
const [adminPassword, setAdminPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [authError, setAuthError] = useState('');
const [toast, setToast] = useState<string>('');
const [authLoading, setAuthLoading] = useState(true);
useEffect(() => {
  const token = localStorage.getItem('accuhire_token');

  if (!token) {
    setView('login');
    setAuthLoading(false);
    return;
  }

 api.getCurrentUser()
  .then(user => {
    setCurrentUser(user);
    setView('dashboard');
  })
    .catch(() => {
      localStorage.removeItem('accuhire_token');
      setCurrentUser(null);
      setView('login');
    })
    .finally(() => {
      setAuthLoading(false);
    });
}, []);


  // Admin Settings State
  const [settings, setSettings] = useState({
    loggerEnabled: true,
    maxCandidateEdits: 3,
    maxDaysForEdit: 7,
    allowRejectedReapply: false,
  });

  // Edit Job Modal
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [editingJob, setEditingJob] = useState<Partial<JobPosting>>({});

  // Edit App Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Partial<Application>>({});



 useEffect(() => {
  const loadSettings = async () => {
    try {
      const data = await api.getAdminSettings();
      if (data) {
        setSettings({
          loggerEnabled: data.logger_enabled ?? true,
          maxCandidateEdits: data.max_candidate_edits ?? 3,
          maxDaysForEdit: data.max_days_for_edit ?? 7,
          allowRejectedReapply: data.allow_rejected_reapply ?? false,
        });
      }

    } catch (e) {
      logger.warn('[ADMIN] Failed to load settings, using defaults');
    }
  };

  loadSettings();
}, []);
const saveSettings = async () => {
  try {
    await api.saveAdminSettings(settings);
    setToast('Settings saved successfully');
    logger.info('[ADMIN] Settings updated:', settings);
  } catch (e) {
    setToast('Failed to save settings');
    logger.error('[ADMIN] Error saving settings:', e);
  } finally {
    setTimeout(() => setToast(''), 3000);
  }
};



  if (authLoading) {
    return null; // or spinner
  }

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { user, token } = await api.login({ email: adminEmail, password: adminPassword, role: 'admin' });
      logger.info('[ADMIN] Admin login successful');
      localStorage.setItem('accuhire_token', token);
      setCurrentUser(user);
      setView('dashboard');
      setAdminPassword('');
      setAdminEmail('');
    } catch (err) {
      logger.error('[ADMIN] Failed admin login attempt');
      setAuthError('Invalid admin email or password');
    }
  };

  const handleLogout = () => {
    logger.info('[ADMIN] Admin logout');
    setCurrentUser(null);
    localStorage.removeItem('accuhire_token');
    setView('login');
  };


  const updateJob = async (jobId: string, updates: Partial<JobPosting>) => {
    try {
      await api.updateJob(jobId, updates);
      logger.info('[ADMIN] Job updated:', { jobId, updates });
      setToast('Job updated successfully');
      setTimeout(() => setToast(''), 3000);
      setSelectedJob(null);
    } catch (err) {
      setToast('Error updating job');
      setTimeout(() => setToast(''), 3000);
    }
  };

const deleteJob = async (jobId: string) => {
  try {
    await api.deleteJob(jobId);


    setToast('Job deleted successfully');
    setTimeout(() => setToast(''), 3000);
     window.location.reload();
    
    logger.info('[ADMIN] Job deleted:', jobId);
  } catch (e) {
    setToast('Failed to delete job');
    setTimeout(() => setToast(''), 3000);
    logger.error('[ADMIN] Delete job failed', e);
  }
};


  const updateApplication = async (appId: string, status: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(appId, status);
      logger.info('[ADMIN] Application updated:', { appId, status });
      setToast('Application updated');
      setTimeout(() => setToast(''), 3000);
      setSelectedApp(null);
    } catch (err) {
      setToast('Error updating application');
      setTimeout(() => setToast(''), 3000);
    }
  };

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-red-600 p-12 text-white text-center">
            <h1 className="text-3xl font-black tracking-tight">Admin Portal</h1>
            <p className="text-red-100 mt-2 text-sm font-bold">AccuHire Control Center</p>
          </div>
          <div className="p-12">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold"
                  placeholder="Enter admin email"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold pr-12"
                  placeholder="Enter admin password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-9 transform -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.636-1.364" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.21.896-4.21 2.343-5.657" /></svg>
                  )}
                </button>
              </div>
              {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
              <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">
                Admin Login
              </button>
              <p className="text-xs text-slate-500 text-center font-bold">Demo Email: <span className="text-slate-700">admin@accuhire.com</span> | Password: <span className="text-slate-700">admin123</span></p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={currentUser} onLogout={handleLogout} onNavigate={(v) => setView(v as any)} />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setView('dashboard')}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
              view === 'dashboard' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('jobs')}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
              view === 'jobs' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setView('recruiters')}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
              view === 'recruiters' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Recruiters
          </button>
          <button
            onClick={() => setView('applications')}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
              view === 'applications' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
              view === 'settings' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Settings
          </button>
        </div>

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
              <p className="text-slate-500 font-bold mt-1">System Overview & Control</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div onClick={() => setView('jobs')} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Jobs</p>
                <JobsCount />
              </div>
              <div onClick={() => setView('recruiters')} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Recruiters</p>
                <RecruitersCount />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Applications</p>
                <ApplicationsCount />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logger Status</p>
                <p className={`text-2xl font-black ${settings.loggerEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {settings.loggerEnabled ? 'ON' : 'OFF'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ALL JOBS */}
        {view === 'jobs' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">All Posted Jobs</h2>
              <p className="text-slate-500 font-bold mt-1">Manage all recruiter jobs</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <AllJobsList setSelectedJob={setSelectedJob} setEditingJob={setEditingJob} deleteJob={deleteJob} />
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        {view === 'applications' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">All Applications</h2>
              <p className="text-slate-500 font-bold mt-1">Monitor and manage applications</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <AllApplicationsList setSelectedApp={setSelectedApp} setEditingApp={setEditingApp} />
            </div>
          </div>
        )}

        {/* RECRUITERS */}
        {view === 'recruiters' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">All Recruiters</h2>
              <p className="text-slate-500 font-bold mt-1">Manage all recruitment team members</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AllRecruitersList setToast={setToast} />
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {view === 'settings' && (
          <div className="max-w-2xl bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h2>
              <p className="text-slate-500 font-bold mt-1">Configure platform behavior</p>
            </div>

            <div className="space-y-6">
              <div className="border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Logger Status</h3>
                    <p className="text-sm text-slate-500 mt-1">Enable/disable debug logging across portals</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.loggerEnabled}
                      onChange={(e) => setSettings({ ...settings, loggerEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="border-b pb-6">
                <label className="block text-lg font-black text-slate-900 mb-2">Max Candidate Application Edits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxCandidateEdits??0}
                  onChange={(e) => setSettings({ ...settings, maxCandidateEdits: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">How many times can a candidate edit their application</p>
              </div>

              <div className="border-b pb-6">
                <label className="block text-lg font-black text-slate-900 mb-2">Max Days for Application Edit</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.maxDaysForEdit??0}
                  onChange={(e) => setSettings({ ...settings, maxDaysForEdit: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">Days after submission to allow edits (0 = unlimited)</p>
              </div>

              <div className="border-b pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Allow Rejected Candidates to Re-apply</h3>
                    <p className="text-sm text-slate-500 mt-1">Permit reapplication after rejection</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.allowRejectedReapply}
                      onChange={(e) => setSettings({ ...settings, allowRejectedReapply: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-red-600 text-white font-black py-4 rounded-3xl shadow-lg uppercase tracking-widest text-sm hover:bg-red-700 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-slate-900">Edit Job</h2>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Title</label>
                <input
                  value={editingJob.title || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">Company</label>
                  <input
                    value={editingJob.company || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">Location</label>
                  <input
                    value={editingJob.location || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">Category</label>
                  <select
                    value={editingJob.category || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="engineering">Engineering</option>
                    <option value="product">Product</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">Salary</label>
                  <input
                    value={editingJob.salary || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                    placeholder="e.g., 50,000 - 70,000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Description</label>
                <textarea
                  value={editingJob.description || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Requirements (comma-separated)</label>
                <textarea
                  value={typeof editingJob.requirements === 'string' ? editingJob.requirements : (editingJob.requirements || []).join(', ')}
                  onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value.split(',').map(r => r.trim()) })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold text-sm"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>
              <button
                onClick={() => updateJob(selectedJob.id, editingJob)}
                className="w-full bg-blue-600 text-white font-black py-3 rounded-2xl uppercase text-sm hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
};

export default AdminApp;
