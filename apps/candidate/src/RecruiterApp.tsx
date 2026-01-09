"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, JobPosting, Application, JobCategory, ApplicationStatus, EmploymentStatus } from '../../../apps/candidate/src/types';
import Navbar from '../../../apps/candidate/src/components/Navbar';
import {logger} from '../../../apps/candidate/src/services/logger';
import {Toast} from '../../../apps/candidate/src/components/Toast';
import { api } from './api';
import RecruiterJobsList from './components/RecruiterJobsLists';
import RecruiterApplicationsList from './components/RecruiterApplicationsList';
const LOCATIONS = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Remote'];
const STATUS_OPTIONS: ApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFER_EXTENDED",
  "REJECTED",
  "WITHDRAWN",
  "HIRED"
];
import { ArrowLeftIcon } from "@heroicons/react/24/outline";



const RecruiterApp: React.FC = () => {
 const [currentUser, setCurrentUser] = useState<User | null>(null);

useEffect(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('accuhire_session');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.warn('Invalid session data');
      }
    }
  }
}, []);

  const [view, setView] = useState<'login' | 'signup' | 'otp_verify' | 'dashboard' | 'post' | 'applications' | 'edit'>('login');
  const [tempUser, setTempUser] = useState<Partial<User>>({});
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [editingJob, setEditingJob] = useState<Partial<JobPosting>>({});
  const [toast, setToast] = useState<string>('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('accuhire_session', JSON.stringify(currentUser));
      if (['login', 'signup', 'otp_verify'].includes(view)) {
        setView('dashboard');
      }
    }
  }, [currentUser, view]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    const formData = new FormData(e.currentTarget);
    const mobile = formData.get('mobile') as string;
    logger.info('[RECRUITER] Login attempt for mobile:', mobile);
    try {
      const user = await api.findUser({ mobile });
      if (user) {
        logger.info('[RECRUITER] User found:', user.name);
        if (user.role !== UserRole.RECRUITER) {
          setAuthError(`This portal is for Recruiters. Switch to Candidate portal.`);
          return;
        }
        await api.sendOtp({ mobile: user.mobile, email: user.email });
        setTempUser(user);
        setResendTimer(30);
        setView('otp_verify');
      } else {
        setAuthError('Mobile number not found. Please sign up.');
      }
    } catch (err) {
      setAuthError('Error connecting to database.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    const formData = new FormData(e.currentTarget);
    const mobile = formData.get('mobile') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    logger.info('[RECRUITER] Signup attempt:', { name, mobile, email });
    try {
      const existing = await api.findUser({ mobile, email });
      if (existing) {
        logger.warn('[RECRUITER] Mobile or Email already registered:', mobile);
        setAuthError('Mobile or Email already registered.');
        return;
      }
      await api.sendOtp({ mobile, email });
      setTempUser({ name, mobile, email, role: UserRole.RECRUITER });
      logger.info('[RECRUITER] Temp user created for OTP verification');
      setResendTimer(30);
      setView('otp_verify');
    } catch (err) {
      setAuthError('Error connecting to database.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setAuthError('');
  logger.info('[RECRUITER] OTP verification attempt');

  try {
    const response = await api.verifyOtp({
      identifier: tempUser.mobile || tempUser.email!,
      otp,
      role: UserRole.RECRUITER,
    });

    // Backend now guarantees token + user for both signup & login
    localStorage.setItem('accuhire_token', response.token);
    localStorage.setItem(
      'accuhire_session',
      JSON.stringify(response.user)
    );

    setCurrentUser(response.user);

    logger.info(
      '[RECRUITER] Auth successful:',
      response.user.role,
      response.user.mobile
    );

  } catch (err) {
    logger.error('[RECRUITER] OTP verification failed', err);
    setAuthError('Invalid or expired OTP');
  }
};


  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await api.sendOtp({ mobile: tempUser.mobile, email: tempUser.email });
      setResendTimer(30);
      setAuthError('');
    } catch (err) {
      setAuthError('Failed to resend OTP');
    }
  };

  const handleLogout = () => {
    logger.info('[RECRUITER] User logout:', currentUser?.name);
    localStorage.removeItem('accuhire_session');
    localStorage.removeItem('accuhire_token');
    setCurrentUser(null);
    setView('login');
  };

 const handleEditJob = (job: JobPosting) => {
  setSelectedJob(job);

  setEditingJob({
    title: job.title ?? '',
    company: job.company ?? '',
    location: job.location ?? '',
    category: job.category ?? undefined,
    salary: job.salary ?? '',
    description: job.description ?? '',
    requirements: job.requirements ?? [],
  });

  setView('edit');
};
const JOB_LOCATIONS = [
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Remote',
] as const;

type JobLocation = typeof JOB_LOCATIONS[number];



  const saveJobChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) return;
     setIsSubmitting(true);
     try {
    
    // Update job in database
       const updated = await api.updateJob(selectedJob.id, editingJob);
       if (updated) {
         logger.info('[RECRUITER] Job updated in database:', { jobId: selectedJob.id, changes: editingJob });
         setToast('Job updated successfully');
         setTimeout(() => setToast(''), 3000);
         setSelectedJob(null);
         setView('dashboard');
       }
     } catch (error) {
       logger.error('[RECRUITER] Error updating job:', error);
       setToast('Error updating job. Please try again.');
       setTimeout(() => setToast(''), 3000);
     } finally {
       setIsSubmitting(false);
     }
  };

  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
     setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
     try {
       const newJob: Omit<JobPosting, 'id' | 'createdAt'> = {
      recruiterId: currentUser.id,
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      category: formData.get('category') as JobCategory,
      description: formData.get('description') as string,
      requirements: (formData.get('requirements') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      location: formData.get('location') as string,
      salary: formData.get('salary') as string,
         };
       // Save to PostgreSQL
       const savedJob = await api.createJob(currentUser.id, newJob);
       logger.info('[RECRUITER] Job posted to database:', { id: savedJob.id, title: newJob.title, company: newJob.company, location: newJob.location });
       setToast('Job posted successfully');
       setTimeout(() => setToast(''), 3000);
       setView('dashboard');
     } catch (error) {
       logger.error('[RECRUITER] Error posting job:', error);
       setToast('Error posting job. Please try again.');
       setTimeout(() => setToast(''), 3000);
     } finally {
       setIsSubmitting(false);
     }
  };

  const updateStatus = (appId: string, status: ApplicationStatus) => {
    logger.info('[RECRUITER] Updating application status:', { appId, status });
     api.updateApplicationStatus(appId, status)
       .then(() => {
         logger.info('[RECRUITER] Application status updated in database:', { appId, status });
       })
       .catch((error) => {
         logger.error('[RECRUITER] Error updating application status:', error);
       });
    setSelectedJob(selectedJob ? { ...selectedJob } : null);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-700';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'INTERVIEW_SCHEDULED': return 'bg-amber-100 text-amber-700';
      case 'OFFER_EXTENDED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'HIRED': return 'bg-teal-100 text-teal-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // AUTH
  if (['login', 'signup', 'otp_verify'].includes(view)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-blue-600 p-12 text-white text-center relative">
            <h1 className="text-3xl font-black tracking-tight">Recruiter Login</h1>
          </div>
          <div className="p-12">
            {view === 'otp_verify' ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                <p className="text-sm text-slate-500 font-medium">OTP sent to <span className="font-bold text-slate-800">{tempUser.mobile}</span></p>
                <input autoFocus maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center text-4xl font-black tracking-[1rem] bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl outline-none" placeholder="0000" />
                {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">Verify OTP</button>
                <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  disabled={resendTimer > 0}
                  className={`text-xs font-bold uppercase tracking-widest mt-4 ${resendTimer > 0 ? 'text-slate-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={view === 'login' ? handleLoginSubmit : handleSignupSubmit} className="space-y-6">
                {view === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input name="name" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="E.g. Rajesh" />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile (Mandatory)</label>
                  <input name="mobile" required type="tel" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="+91 99999 00000" />
                </div>
                {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">{view === 'login' ? 'Get OTP' : 'Sign Up'}</button>
                <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="w-full text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase mt-4">{view === 'login' ? "New Here? Sign Up" : "Member? Sign In"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={currentUser} onLogout={handleLogout} onNavigate={(v) => setView(v as any)} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hiring Console</h2>
                <p className="text-slate-500 font-bold mt-1">Managing talent for ID: {currentUser?.mobile}</p>
              </div>
              <button onClick={() => setView('post')} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest">Publish New Role</button>
            </div>
            <RecruiterJobsList   role={currentUser?.role === 'ADMIN' ? 'ADMIN' : 'RECRUITER'} handleEditJob={handleEditJob} setSelectedJob={setSelectedJob} setView={setView} />
          </div>
        )}

       {view === 'edit' && selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between p-8">
              <h2 className="text-3xl font-black text-slate-900">Edit Job</h2>
              <button
                onClick={() => setView('dashboard')}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={saveJobChanges} className="p-8 space-y-6">

              {/* Job Title */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Job Title
                </label>
                <input
                  value={editingJob.title ?? ''}
                  onChange={(e) =>
                    setEditingJob({ ...editingJob, title: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                  required
                />
              </div>

              {/* Company & Salary */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    Company
                  </label>
                  <input
                    value={editingJob.company ?? ''}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, company: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    Salary
                  </label>
                  <input
                    value={editingJob.salary ?? ''}
                    onChange={(e) =>
                      setEditingJob({ ...editingJob, salary: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                  />
                </div>
              </div>

              {/* Category (ENUM SAFE) */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={editingJob.category ?? ''}
                  onChange={(e) =>
                    setEditingJob({
                      ...editingJob,
                      category: e.target.value
                        ? (e.target.value as JobCategory)
                        : undefined,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                >
                  <option value="">Select category</option>
                  {Object.values(JobCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Location
                </label>

                <select
                  value={editingJob.location ?? ''}
                  onChange={(e) =>
                    setEditingJob({
                      ...editingJob,
                      location: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                >
                  <option value="">Select location</option>

                  {JOB_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>


              {/* Requirements */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Requirements (comma separated)
                </label>
                <input
                  value={(editingJob.requirements ?? []).join(', ')}
                  onChange={(e) =>
                    setEditingJob({
                      ...editingJob,
                      requirements: e.target.value
                        .split(',')
                        .map(r => r.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                  placeholder="GST, TDS, SAP"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editingJob.description ?? ''}
                  onChange={(e) =>
                    setEditingJob({ ...editingJob, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl font-bold"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-3 rounded-2xl uppercase"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

        {view === 'applications' && selectedJob && (
          <div className="space-y-6">
           <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
             
               <button
                    onClick={() => setView("dashboard")}
                    className="flex items-center gap-2 text-xl font-bold text-green-600 mb-8 hover:text-green-700 transition"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
              </button>
         
              <h2 className="text-3xl font-black text-slate-900">
                Applications for {selectedJob.title}
              </h2>
             
            </div>

            <RecruiterApplicationsList
              job={selectedJob}
              updateStatus={updateStatus}
              getStatusColor={getStatusColor}
            />
          </div>
        )}


        {view === 'post' && (
          <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
            <button
                    onClick={() => setView("dashboard")}
                    className="flex items-center gap-2 text-xl font-bold text-green-600 mb-8 hover:text-green-700 transition"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
            </button>
            <h2 className="text-4xl font-black text-blue-600 tracking-tight uppercase mb-8">Publish New Role</h2>
            <form onSubmit={handlePostJob} className="space-y-8">
              {/* <div className="grid grid-cols-1 gap-6">
                <RecruiterApplicationsList jobId={selectedJob.id} updateStatus={updateStatus} getStatusColor={getStatusColor} />
              </div> */}

              
                          {/* Job Title */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Job Title
              </label>
              <input
                name="title"
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
                placeholder="Senior Accountant"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Company
              </label>
              <input
                name="company"
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
                placeholder="ABC Pvt Ltd"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Category
              </label>
              <select
                name="category"
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
              >
                <option value="">Select category</option>
                <option value="Accounting">Accounting</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Location
              </label>
              <select
                name="location"
                required
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Salary
              </label>
              <input
                name="salary"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
                placeholder="₹6–8 LPA"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Requirements (comma separated)
              </label>
              <input
                name="requirements"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
                placeholder="GST, TDS, SAP"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Job Description
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold"
                placeholder="Describe the role..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest"
            >
              Publish Job
            </button>

            </form>
          </div>
        )}
      </main>
      {toast && <Toast message={toast} />}
    </div>
  );
};

export default RecruiterApp;
