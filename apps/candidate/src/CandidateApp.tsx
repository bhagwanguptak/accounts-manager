"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, JobPosting, Application, JobCategory, ApplicationStatus, EmploymentStatus } from '../../../apps/candidate/src/types';
import Navbar from '../../../apps/candidate/src/components/Navbar';
import {logger} from '../../../apps/candidate/src/services/logger';
import {Toast} from '../../../apps/candidate/src/components/Toast';
import { CandidateJobsList } from '../../../apps/candidate/src/components/CandidateJobsList';
import { api } from './api';


const LOCATIONS = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Remote'];
const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Others (Please Specify)'];

const CandidateApp: React.FC = () => {

  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'signup' | 'otp_verify' | 'dashboard' | 'apply' | 'forgot_password'>('login');
  const [candidateTab, setCandidateTab] = useState<'jobs' | 'applications' | 'profile'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string>('');
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [tempUser, setTempUser] = useState<Partial<User>>({});
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [candidatePassword, setCandidatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [candidateMobile, setCandidateMobile] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  const jobMap = useMemo(() => {
  return Object.fromEntries(jobs.map(job => [job.id, job]));
  }, [jobs]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const STATUS_STYLES: Record<ApplicationStatus, string> = {
    APPLIED: "bg-blue-100 text-blue-700",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    SHORTLISTED: "bg-blue-50 text-green-700",
    INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700",
    OFFER_EXTENDED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    WITHDRAWN: "bg-gray-200 text-gray-600",
    HIRED: "bg-teal-100 text-teal-700",
  };





            // Load session
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
            //load profile
            useEffect(() => {
              if (candidateTab === 'profile') {
                api.getCandidateProfile()
                  .then(setProfile)
                  .catch(() => setProfile(null));
              }
            }, [candidateTab]);


            // Load jobs
            useEffect(() => {
              const fetchJobs = async () => {
                try{
                const jobs = await api.getAllJobs();
                console.log(' jobs received:', jobs);
                setJobs(jobs);
                } catch (e) {
                  console.error('❌ getAllJobs failed', e);
                }
              };
              fetchJobs();
            }, [refreshCounter]);

            // Load my applications
            useEffect(() => {
              const fetchApplications = async () => {
                if (!currentUser || currentUser.role !== UserRole.CANDIDATE) {
                  setMyApplications([]);
                  return;
                }
                setIsLoadingApplications(true);
                try {
                  const apps = await api.getCandidateApplications();
                  setMyApplications(apps);
                } finally {
                  setIsLoadingApplications(false);
                }
              };
              fetchApplications();
            }, [currentUser, view, refreshCounter]);

            // Save session
            useEffect(() => {
              if (currentUser) {
                localStorage.setItem('accuhire_session', JSON.stringify(currentUser));
                if (["login", "signup", "otp_verify", "forgot_password"].includes(view)) {
                  setView('dashboard');
                }
              }
            }, [currentUser, view]);

            // Resend Timer
            useEffect(() => {
              if (resendTimer > 0) {
                const timerId = setTimeout(() => setResendTimer(t => t - 1), 1000);
                return () => clearTimeout(timerId);
              }
            }, [resendTimer]);

            // Handlers
            const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setAuthError('');
              
              if (loginMode === 'otp') {
                try {
                  const user = await api.findUser({ mobile: candidateMobile, email: candidateEmail });
                  if (user) {
                    if (user.role !== UserRole.CANDIDATE) {
                      setAuthError(`This portal is for Candidates. Switch to Recruiter portal.`);
                      return;
                    }
                    await api.sendOtp({ mobile: user.mobile, email: user.email });
                    setTempUser(user);
                    setResendTimer(30); // Start 30s cooldown
                    setView('otp_verify');
                  } else {
                    setAuthError('Mobile number not found. Please sign up.');
                  }
                } catch (err) {
                  setAuthError('Error connecting to database.');
                }
                return;
              }

              try {
                const { user, token } = await api.login({ mobile: candidateMobile, email: candidateEmail, password: candidatePassword, role: UserRole.CANDIDATE });
                localStorage.setItem('accuhire_token', token);
                setCurrentUser(user);
                setCandidatePassword('');
              } catch (err) {
                setAuthError('Invalid mobile or password');
              }
            };

            const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setAuthError('');
              const formData = new FormData(e.currentTarget);
              const mobile = formData.get('mobile') as string;
              const email = formData.get('email') as string;
              const name = formData.get('name') as string;
              try {
                const existing = await api.findUser({ mobile, email });
                if (existing) {
                  setAuthError('Mobile or Email already registered.');
                  return;
                }
                await api.sendOtp({ mobile, email });
                setTempUser({ name, mobile, email, role: UserRole.CANDIDATE });
                setView('otp_verify');
                setResendTimer(30); // Start 30s cooldown
              } catch (err) {
                setAuthError('Error connecting to database.');
              }
            };

           const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setAuthError('');

                try {
                  //  Verify OTP via backend
                  const response = await api.verifyOtp({
                    identifier: tempUser.mobile || tempUser.email!,
                    otp,
                    role: UserRole.CANDIDATE,
                  });

                  //  STORE JWT (MANDATORY)
                  localStorage.setItem('accuhire_token', response.token);

                  //  Store user for UI
                  localStorage.setItem(
                    'accuhire_session',
                    JSON.stringify(response.user)
                  );
  
                  setCurrentUser({
                  ...response.user,
                  role: UserRole.CANDIDATE, // UI-only
                });
                } catch (err) {
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

            const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setAuthError('');
              const formData = new FormData(e.currentTarget);
              const identifier = formData.get('identifier') as string;
              const otpInput = formData.get('otp') as string;
              const newPass = formData.get('newPassword') as string;

              try {
                await api.resetPassword({ identifier, otp: otpInput, newPassword: newPass });
                setToast('Password reset successfully. Please login.');
                setTimeout(() => setToast(''), 3000);
                setView('login');
              } catch (err) {
                setAuthError('Invalid OTP or failed to reset password.');
              }
            };

            const handleLogout = () => {
              localStorage.removeItem('accuhire_session');
              localStorage.removeItem('accuhire_token');
              setCurrentUser(null);
              setView('login');
            };

            const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              if (!currentUser || !selectedJob) return;
              const alreadyApplied = myApplications.some(a => a.jobId === selectedJob.id);
              if (alreadyApplied) {
                alert("You have already applied for this position.");
                setView('dashboard');
                return;
              }
             setIsSubmitting(true);

              const formData = new FormData(e.currentTarget);

              const applicationPayload = {
                experience: formData.get('experience') as string,              // "3 years"
                expectedCTC: formData.get('expectedCTC') as string,          // "5"
                noticePeriod: formData.get('noticePeriod') as string,        // "Immediate"
                preferredLocation: formData.get('preferredLocation') as string, // "Mumbai"
                expertise: (formData.get('expertise') as string)             // "GST"
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean),                                          // ["GST"]
                coverLetter: formData.get('coverLetter') as string,          // "dasdasd"
              };

              // ✅ CALL API
              

              try {
                await api.createApplication(selectedJob.id, applicationPayload);
                setToast('Application submitted successfully');
                setTimeout(() => setToast(''), 3000);
                setIsSubmitting(false);
                setView('dashboard');
                setRefreshCounter(c => c + 1);
              } catch (err) {
                setToast('Error submitting application');
                setTimeout(() => setToast(''), 3000);
                setIsSubmitting(false);
              }
            };

            const handleWithdraw = async (applicationId: string) => {
              try {
                const ok = await api.withdrawApplication(applicationId, currentUser.id);

                if (ok) {
                  setToast('Application withdrawn');
                  setTimeout(() => setToast(''), 3000);
                  setRefreshCounter(c => c + 1);
                } else {
                  setToast('Unable to withdraw');
                  setTimeout(() => setToast(''), 3000);
                }
              } catch {
                setToast('Error withdrawing application');
                setTimeout(() => setToast(''), 3000);
              }
            };


          const normalizeStatus = (status: string) => {
            return status.trim().toUpperCase().replace(/\s+/g, "_");
              };    
        
                                    // 🔹 Info label
          const Info = ({ label, value, highlight = false,className='' }: any) => (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
              <p className={`font-black ${highlight ? 'text-blue-600' : 'text-slate-800'}${className}`}>
                {value || '—'}
              </p>
            </div>
          );

          // 🔹 Skeleton loader
          const AppliedJobSkeleton = () => (
            <div className="border border-slate-200 rounded-3xl p-8 animate-pulse bg-white">
              <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
              <div className="h-4 w-20 bg-slate-200 rounded mb-6" />
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-20 bg-slate-300 rounded" />
                  </div>
                ))}
              </div>
            </div>
          );
          
          // 🔹 Application card
         const AppliedJobCard = ({ app, job, onWithdraw }: any) => {
           const normalizedStatus = app.isWithdrawn
                                        ? "WITHDRAWN"
                                        : normalizeStatus(app.applicationStatus);

          const isWithdrawn = app.applicationStatus === 'Withdrawn';

          return (
            <div className="bg-white border border-blue-200 rounded-3xl p-5 sm:p-8 flex flex-col gap-6">

              {/* HEADER */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {job?.title || 'Job'}
                </h3>
                
                 <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full
                      text-[11px] sm:text-xs font-black
                       ${STATUS_STYLES[normalizedStatus as ApplicationStatus]}
                    `}
                  >
                    {normalizedStatus.replace(/_/g, " ")}
              </span>
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
                <Info label="Experience" value={app.experience || '—'} />
                <Info
                  label="Expected"
                  value={app.salaryExpectation ? `₹ ${app.salaryExpectation} LPA` : '—'}
                  highlight
                  className="text-green-600"
                />
                <Info label="Notice" value={app.noticePeriod || '—'} />
                <Info label="City" value={app.location || '—'} />
              </div>

              {/* EXPERTISE */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase mb-2">
                  Expertise
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(app.expertise) &&
                    app.expertise.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>

              {/* ACTION */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => onWithdraw(app.id)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm transition
                  ${
                    isWithdrawn
                      ? 'border border-slate-300 text-slate-400 bg-slate-100 cursor-not-allowed'
                      : 'border border-red-400 text-red-600 hover:bg-red-50'
                  }
                `}
                >
                 {isWithdrawn ? 'Withdrawn' : 'Withdraw Application'}
                </button>
              </div>
            </div>
          );
        };



            // Main render
            if (["login", "signup", "otp_verify", "forgot_password"].includes(view)) {
              return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                  <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                    <div className="bg-emerald-500 p-12 text-white text-center relative">
                      <h1 className="text-3xl font-black tracking-tight">Candidate Login</h1>
                    </div>
                    <div className="p-12">
                      {view === 'otp_verify' ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                          <p className="text-sm text-slate-500 font-medium">OTP sent to <span className="font-bold text-slate-800">{tempUser.mobile}</span></p>
                          <input autoFocus maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center text-4xl font-black tracking-[1rem] bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl outline-none" placeholder="0000" />
                          {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">Verify OTP</button>
                          <button 
                            type="button" 
                            onClick={handleResendOtp} 
                            disabled={resendTimer > 0}
                            className={`text-xs font-bold uppercase tracking-widest ${resendTimer > 0 ? 'text-slate-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                          >
                            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                          </button>
                        </form>
                      ) : view === 'signup' ? (
                        <form onSubmit={handleSignupSubmit} className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                            <input name="name" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="E.g. Rahul" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile (Mandatory)</label>
                            <input name="mobile" required type="tel" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="+91 99999 00000" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (For OTP Fallback)</label>
                            <input name="email" type="email" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="john@example.com" />
                          </div>
                          {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">Sign Up</button>
                          <button type="button" onClick={() => setView('login')} className="w-full text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase mt-4">Already a member? Login</button>
                        </form>
                      ) : view === 'forgot_password' ? (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile or Email</label>
                            <div className="flex gap-2">
                              <input 
                                name="identifier" 
                                required 
                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" 
                                placeholder="Enter registered mobile/email"
                                onChange={(e) => setTempUser({ ...tempUser, mobile: e.target.value })}
                              />
                              <button 
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendTimer > 0}
                                className="bg-slate-100 text-slate-600 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                              >
                                {resendTimer > 0 ? `${resendTimer}s` : 'Send OTP'}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Enter OTP</label>
                            <input name="otp" required maxLength={4} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-center tracking-[0.5em]" placeholder="0000" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                            <input name="newPassword" required type="password" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="Enter new password" />
                          </div>
                          {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">Reset Password</button>
                          <button type="button" onClick={() => setView('login')} className="w-full text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase mt-4">Back to Login</button>
                        </form>
                      ) : (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Mode</label>
                            <button type="button" className="text-xs font-bold text-emerald-600 underline" onClick={() => setLoginMode(loginMode === 'otp' ? 'password' : 'otp')}>
                              Switch to {loginMode === 'otp' ? 'Password' : 'OTP'} Login
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile</label>
                            <input
                              type="tel"
                              required
                              value={candidateMobile}
                              onChange={e => setCandidateMobile(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold"
                              placeholder="Enter your mobile"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                            <input
                              type="email"
                              value={candidateEmail}
                              onChange={e => setCandidateEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold"
                              placeholder="Enter your email"
                            />
                          </div>
                          {loginMode === 'password' && (
                            <div className="relative">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={candidatePassword}
                                onChange={e => setCandidatePassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold pr-12"
                                placeholder="Enter your password"
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
                          )}
                          {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                          {loginMode === 'password' && <div className="text-right"><button type="button" onClick={() => setView('forgot_password')} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest">Forgot Password?</button></div>}
                          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm">{loginMode === 'otp' ? 'Get OTP' : 'Login'}</button>
                          <button type="button" onClick={() => setView('signup')} className="w-full text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase mt-4">New Here? Sign Up</button>
                          <p className="text-xs text-slate-500 text-center font-bold">Demo Password: <span className="text-slate-700">candidate123</span></p>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
           

            // Dashboard/main render
            return (
              <div className="min-h-screen bg-slate-50">
                <Navbar user={currentUser} onLogout={handleLogout} onNavigate={(v) => setView(v as any)} />
                <main className="max-w-7xl mx-auto px-6 py-12">
                  <div className="space-y-8">
                    <div className="flex bg-slate-200 p-1.5 rounded-3xl w-full max-w-md mx-auto mb-10">
                      <button onClick={() => setCandidateTab('profile')} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest ${candidateTab === 'profile'? 'bg-white text-emerald-600': 'text-slate-500'}`}>Profile</button>
                      <button onClick={() => setCandidateTab('jobs')} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${candidateTab === 'jobs' ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>Find Jobs</button>
                      <button onClick={() => setCandidateTab('applications')} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${candidateTab === 'applications' ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>Applied Jobs</button>
                    </div>
                    {candidateTab === 'jobs' && (
                      
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Opportunities Hub</h2>
                          <p className="text-slate-500 font-bold mt-1">Verified: {currentUser?.mobile}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          <CandidateJobsList jobs={jobs} setSelectedJob={setSelectedJob} setView={(v: string) => setView(v as any)} myApplications={myApplications} />
                        </div>
                      </div>
                      
                    )}
                    {/*{candidateTab === 'applications' && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Applications</h2>
                          <p className="text-slate-500 font-bold mt-1">Track your applications</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          {myApplications.map(app => (
                            <div key={app.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                              <div className="flex flex-col lg:flex-row justify-between gap-8">
                                <div className="flex-1">
                                  <h3 className="text-3xl font-black text-slate-900 mb-1">Job Title: {jobMap[app.jobId]?.title || 'Job'}</h3>
                                  <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ${getStatusColor(app.applicationStatus)}`}>
                                    {app.applicationStatus}
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 pt-4 border-t border-slate-100 mt-6">
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p><p className="text-sm font-bold text-slate-800">{app.experience}</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected</p><p className="text-sm font-black text-blue-600">₹{app.expectedCTC} LPA</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notice</p><p className="text-sm font-bold text-slate-800">{app.noticePeriod}</p></div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pref. City</p><p className="text-sm font-bold text-slate-800">{app.preferredLocation}</p></div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expertise</p>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.isArray(app.expertise) &&
                                        app.expertise.map((tag, i) => (
                                          <span
                                            key={i}
                                            className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-100 uppercase tracking-tight"
                                          >
                                            {tag}
                                          </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="lg:w-1/3 space-y-4 bg-slate-50 p-6 rounded-3xl flex items-center justify-end">
                                  <button onClick={() => handleWithdraw(app.id)} className="text-[11px] font-black px-4 py-2.5 rounded-xl border bg-red-50 text-red-600 hover:bg-red-100">Withdraw Application</button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {myApplications.length === 0 && (
                            <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest">No Applications Found</div>
                          )}
                        </div>
                      </div>
                    )}*/}
                    {candidateTab === 'applications' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-black">My Applications</h2>

                      {isLoadingApplications && (
                        <>
                          <AppliedJobSkeleton />
                          <AppliedJobSkeleton />
                        </>
                      )}

                      {!isLoadingApplications && myApplications.length === 0 && (
                        <div className="text-center py-16 text-slate-500 font-bold">
                          You haven’t applied to any jobs yet.
                        </div>
                      )}

                      {!isLoadingApplications &&
                        myApplications.map(app => (
                          <AppliedJobCard
                            key={app.id}
                            app={app}
                            job={jobMap[app.jobId]}
                            onWithdraw={handleWithdraw}
                          />
                        ))}
                    </div>
                  )}

                  {candidateTab === 'profile' && profile && (
                  <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <h2 className="text-3xl font-black mb-8">My Profile</h2>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsProfileSaving(true);

                        const form = new FormData(e.currentTarget);

                        const payload: any = {
                          name: form.get('name'),
                          experience: form.get('experience'),
                          noticePeriod: form.get('noticePeriod'),
                          preferredLocation: form.get('preferredLocation'),
                          expertise: (form.get('expertise') as string)
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean),
                        };

                        const email = form.get('email');
                        if (email && email.toString().trim() !== '') {
                          payload.email = email;
                        }

                        await api.updateCandidateProfile(payload);


                        setToast('Profile updated successfully');
                        setTimeout(() => setToast(''), 3000);
                        setIsProfileSaving(false);
                      }}
                      className="space-y-6"
                    >
                      <input
                        name="name"
                        defaultValue={profile.name}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Full Name"
                      />

                      <input
                        name="email"
                        defaultValue={profile.email}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Email"
                      />

                      <input
                        name="experience"
                        defaultValue={profile.experience}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Experience (years)"
                      />

                      <input
                        name="noticePeriod"
                        defaultValue={profile.notice_period}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Notice Period"
                      />

                      <input
                        name="preferredLocation"
                        defaultValue={profile.preferred_location}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Preferred Location"
                      />

                      <input
                        name="expertise"
                        defaultValue={(profile.expertise || []).join(', ')}
                        className="w-full bg-slate-50 border p-4 rounded-2xl font-bold"
                        placeholder="Skills (comma separated)"
                      />

                      <button
                        type="submit"
                        disabled={isProfileSaving}
                        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl"
                      >
                        {isProfileSaving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </form>
                  </div>
                )}

                  </div>
                  {view === 'apply' && selectedJob && (
                    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                      <div className="max-w-2xl w-full bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between p-8 rounded-t-[3.5rem]">
                          <div>
                            <h2 className="text-3xl font-black text-emerald-500 tracking-tight uppercase">Apply Now</h2>
                            <p className="text-slate-500 font-bold mt-1 text-sm">for <span className="text-slate-900">{selectedJob.title}</span></p>
                          </div>
                          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                        <form onSubmit={handleApply} className="p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Professional Level</label>
                              <select name="status" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm">
                                <option value="Working Professional">Working Professional</option>
                                <option value="Student">Student</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Experience (Years)</label>
                              <input name="experience" required type="number" step="0.5" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm" placeholder="E.g. 2.5" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expected Salary (LPA)</label>
                              <input name="expectedCTC" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm" placeholder="E.g. 12.0" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notice Period</label>
                              <select name="noticePeriod" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm">
                                {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Preferred Base City</label>
                              <select name="preferredLocation" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm max-h-40 overflow-y-auto">
                                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                              </select>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expertise</label>
                               <input name="expertise" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm" placeholder="E.g. GST, Audit" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cover Letter</label>
                            <textarea name="coverLetter" required rows={3} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl outline-none font-medium text-slate-700 text-sm" placeholder="Brief pitch to recruiter..."/>
                          </div>
                          <button type="submit" className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40'} text-white font-black py-4 rounded-3xl transition-all shadow-lg uppercase tracking-widest text-xs`}>
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </main>
                {toast && <Toast message={toast} />}
              </div>
            );
          };
export default CandidateApp;