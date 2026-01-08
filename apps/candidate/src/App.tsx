// // ...existing imports...
// import { useCallback } from 'react';

// import React, { useState, useEffect, useMemo } from 'react';
// import { User, UserRole, JobPosting, Application, JobCategory, ApplicationStatus, EmploymentStatus, logger, Navbar, Toast } from '@accuhire/shared';
// import * as database from './services/database';

// // Recruiter jobs list component
// const RecruiterJobsList: React.FC<{ recruiterId: string, setSelectedJob: (job: JobPosting) => void, setView: (v: string) => void }> = ({ recruiterId, setSelectedJob, setView }) => {
//   const [jobs, setJobs] = useState<JobPosting[]>([]);
//   useEffect(() => {
//     const fetchJobs = async () => {
//       const jobs = await database.getJobsByRecruiter(recruiterId);
//       setJobs(jobs);
//     };
//     fetchJobs();
//   }, [recruiterId]);
//   return <>
//     {jobs.map(job => (
//       <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group">
//         <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h3>
//         <p className="text-sm text-slate-500 mb-8 font-semibold">{job.company} • {job.location}</p>
//         <div className="flex justify-between items-center border-t pt-6 border-slate-100">
//           <div className="flex flex-col">
//             {/* Optionally fetch applications count if needed */}
//             <span className="text-xl font-black text-slate-900">-</span>
//             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Applicants</span>
//           </div>
//           <button onClick={() => { setSelectedJob(job); setView('applications'); }} className="bg-slate-900 text-white text-[10px] font-black px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-lg">View Pipeline</button>
//         </div>
//       </div>
//     ))}
//   </>;
// };

// import { CandidateJobsList } from '../../../packages/shared/src/components/CandidateJobsList';
// "use client";


// const LOCATIONS = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Remote'];
// const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Others (Please Specify)'];
// const STATUS_OPTIONS: ApplicationStatus[] = ['Applied', 'Under Review', 'Interview Scheduled', 'Offer Extended', 'Rejected'];

// const App: React.FC = () => {
//  const [currentUser, setCurrentUser] = useState<User | null>(null);

// useEffect(() => {
//   if (typeof window !== 'undefined') {
//     const saved = localStorage.getItem('accuhire_session');
//     if (saved) {
//       try {
//         setCurrentUser(JSON.parse(saved));
//       } catch (e) {
//         console.warn('Invalid session data');
//       }
//     }
//   }
// }, []);

  
//   const [view, setView] = useState<'portal_select' | 'login' | 'signup' | 'otp_verify' | 'dashboard' | 'post' | 'apply' | 'applications'>('portal_select');
//   const [activePortal, setActivePortal] = useState<UserRole | null>(null);
//   const [tempUser, setTempUser] = useState<Partial<User>>({});
//   const [otp, setOtp] = useState('');
//   const [authError, setAuthError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
//   const [toast, setToast] = useState<string>('');
//   const [refreshCounter, setRefreshCounter] = useState<number>(0);
//   const [candidateTab, setCandidateTab] = useState<'jobs' | 'applications'>('jobs');

//   // Get current user's applications for double-apply check and visibility
//   const [myApplications, setMyApplications] = useState<Application[]>([]);
//   useEffect(() => {
//     const fetchApplications = async () => {
//       if (!currentUser || currentUser.role !== UserRole.REQUESTOR) {
//         setMyApplications([]);
//         return;
//       }
//       // Fetch all applications and filter by requestorId
//       const allApps = await database.getCandidateApplications(currentUser.id);
//       setMyApplications(allApps);
//     };
//     fetchApplications();
//   }, [currentUser, view, refreshCounter]);

//   useEffect(() => {
//     if (currentUser) {
//       localStorage.setItem('accuhire_session', JSON.stringify(currentUser));
//       if (['portal_select', 'login', 'signup', 'otp_verify'].includes(view)) {
//         setView('dashboard');
//       }
//     }
//   }, [currentUser, view]);

//   const handlePortalSelect = (role: UserRole) => {
//     logger.info('[CANDIDATE] Portal selected:', role);
//     setActivePortal(role);
//     setView('login');
//   };

//   const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setAuthError('');
//     const formData = new FormData(e.currentTarget);
//     const mobile = formData.get('mobile') as string;
//     logger.info('[CANDIDATE] Login attempt for mobile:', mobile);
//     try {
//       const user = await database.getUserByMobile(mobile);
//       if (user) {
//         logger.info('[CANDIDATE] User found:', user.name, 'Role:', user.role);
//         if (user.role !== activePortal) {
//           setAuthError(`Registered as a ${user.role === UserRole.RECRUITER ? 'Recruiter' : 'Candidate'}. Switch portal.`);
//           return;
//         }
//         setTempUser(user);
//         setView('otp_verify');
//       } else {
//         setAuthError('Mobile number not found. Please sign up.');
//       }
//     } catch (err) {
//       setAuthError('Error connecting to database.');
//     }
//   };

//   const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setAuthError('');
//     const formData = new FormData(e.currentTarget);
//     const mobile = formData.get('mobile') as string;
//     const name = formData.get('name') as string;
//     const email = formData.get('email') as string;
//     logger.info('[CANDIDATE] Signup attempt:', { name, mobile, email });
//     try {
//       const existing = await database.getUserByMobile(mobile);
//       if (existing) {
//         logger.warn('[CANDIDATE] Mobile already registered:', mobile);
//         setAuthError('Mobile number already registered.');
//         return;
//       }
//       setTempUser({ name, mobile, email, role: activePortal! });
//       logger.info('[CANDIDATE] Temp user created for OTP verification');
//       setView('otp_verify');
//     } catch (err) {
//       setAuthError('Error connecting to database.');
//     }
//   };

//   const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     logger.info('[CANDIDATE] OTP verification attempt:', otp);
//     if (otp === '1234') {
//       logger.info('[CANDIDATE] OTP valid');
//       if (!tempUser.id) {
//         logger.info('[CANDIDATE] Creating new user');
//         const newUser: User = {
//           id: tempUser.mobile!,
//           name: tempUser.name!,
//           mobile: tempUser.mobile!,
//           email: tempUser.email,
//           role: activePortal!,
//           expertise: tempUser.expertise,
//           experience: tempUser.experience,
//           status: tempUser.status
//         };
//         try {
//           const user = await database.createUser(newUser);
//           logger.info('[CANDIDATE] User signup successful:', user.name);
//           setCurrentUser(user);
//         } catch (err) {
//           setAuthError('Error creating user in database.');
//         }
//       } else {
//         setCurrentUser(tempUser as User);
//       }
//     } else {
//       logger.error('[CANDIDATE] Invalid OTP attempt');
//       setAuthError('Invalid OTP. Use 1234');
//     }
//   };

//   const handleLogout = () => {
//     logger.info('[CANDIDATE] User logout:', currentUser?.name);
//     localStorage.removeItem('accuhire_session');
//     setCurrentUser(null);
//     setActivePortal(null);
//     setView('portal_select');
//   };

//   const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!currentUser) return;
//     const formData = new FormData(e.currentTarget);
//     const newJob: Omit<JobPosting, 'id' | 'createdAt'> = {
//       recruiterId: currentUser.id,
//       title: formData.get('title') as string,
//       company: formData.get('company') as string,
//       category: formData.get('category') as JobCategory,
//       description: formData.get('description') as string,
//       requirements: (formData.get('requirements') as string || '').split(',').map(s => s.trim()).filter(Boolean),
//       location: formData.get('location') as string,
//       salary: formData.get('salary') as string
//     };
//     try {
//       await database.createJob(currentUser.id, newJob);
//       setView('dashboard');
//     } catch (err) {
//       setToast('Error posting job');
//       setTimeout(() => setToast(''), 3000);
//     }
//   };

//   const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!currentUser || !selectedJob) return;
//     // Prevention: Check if already applied
//     const alreadyApplied = myApplications.some(a => a.jobId === selectedJob.id);
//     if (alreadyApplied) {
//       alert("You have already applied for this position.");
//       setView('dashboard');
//       return;
//     }
//     setIsSubmitting(true);
//     const formData = new FormData(e.currentTarget);
//     const app: Omit<Application, 'id' | 'appliedAt' | 'jobId' | 'candidateId'> = {
//       requestorId: currentUser.id,
//       candidateName: currentUser.name,
//       candidateMobile: currentUser.mobile,
//       experience: formData.get('experience') as string,
//       expertise: formData.get('expertise') as string,
//       coverLetter: formData.get('coverLetter') as string,
//       currentCTC: formData.get('currentCTC') as string,
//       expectedCTC: formData.get('expectedCTC') as string,
//       preferredLocation: formData.get('preferredLocation') as string,
//       noticePeriod: formData.get('noticePeriod') as string,
//       applicationStatus: 'Applied'
//     };
//     try {
//       await database.createApplication(selectedJob.id, currentUser.id, app);
//       logger.info('[CANDIDATE] Application submitted:', { jobTitle: selectedJob.title, candidateName: currentUser.name, noticePeriod: app.noticePeriod });
//       setToast('Application submitted successfully');
//       setTimeout(() => setToast(''), 3000);
//       setIsSubmitting(false);
//       setView('dashboard');
//       setRefreshCounter(c => c + 1);
//     } catch (err) {
//       setToast('Error submitting application');
//       setTimeout(() => setToast(''), 3000);
//       setIsSubmitting(false);
//     }
//   };

//   const handleWithdraw = async (applicationId: string) => {
//     logger.info('[CANDIDATE] Attempting to withdraw application:', applicationId);
//     try {
//       const ok = await database.withdrawApplication(applicationId);
//       if (ok) {
//         logger.info('[CANDIDATE] Application withdrawn successfully:', applicationId);
//         setToast('Application withdrawn');
//         setTimeout(() => setToast(''), 3000);
//         setRefreshCounter(c => c + 1);
//       } else {
//         logger.error('[CANDIDATE] Failed to withdraw application:', applicationId);
//         setToast('Unable to withdraw');
//         setTimeout(() => setToast(''), 3000);
//       }
//     } catch (err) {
//       setToast('Error withdrawing application');
//       setTimeout(() => setToast(''), 3000);
//     }
//   };

//   const updateStatus = async (appId: string, status: ApplicationStatus) => {
//     try {
//       await database.updateApplicationStatus(appId, status);
//       setSelectedJob(selectedJob ? { ...selectedJob } : null);
//     } catch (err) {
//       setToast('Error updating status');
//       setTimeout(() => setToast(''), 3000);
//     }
//   };

//   const getStatusColor = (status: ApplicationStatus) => {
//     switch (status) {
//       case 'Applied': return 'bg-blue-100 text-blue-700';
//       case 'Under Review': return 'bg-purple-100 text-purple-700';
//       case 'Interview Scheduled': return 'bg-amber-100 text-amber-700';
//       case 'Offer Extended': return 'bg-green-100 text-green-700';
//       case 'Rejected': return 'bg-red-100 text-red-700';
//       default: return 'bg-slate-100 text-slate-700';
//     }
//   };

//   // 1. GATEWAY
//   if (view === 'portal_select') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
//         <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
//           <div className="col-span-full text-center mb-8">
//             <h1 className="text-5xl font-black text-white mb-2">AccuHire</h1>
//             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Specialized Accounting Talent Exchange</p>
//           </div>
//           <button onClick={() => handlePortalSelect(UserRole.RECRUITER)} className="group relative bg-blue-600 p-12 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(37,99,235,0.4)] overflow-hidden border-2 border-transparent hover:border-blue-400">
//             <h2 className="text-4xl font-black text-white mb-4">I am a<br/>Recruiter</h2>
//             <p className="text-blue-100 font-medium text-lg opacity-80 mb-8">Hire verified CA, Tax, and Audit experts for your firm.</p>
//             <div className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-sm">Enter Portal <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 12h14"/></svg></div>
//           </button>
//           <button onClick={() => handlePortalSelect(UserRole.REQUESTOR)} className="group relative bg-emerald-500 p-12 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] overflow-hidden border-2 border-transparent hover:border-emerald-300">
//             <h2 className="text-4xl font-black text-white mb-4">I am a<br/>Candidate</h2>
//             <p className="text-emerald-50 font-medium text-lg opacity-80 mb-8">Discover premium roles in CA, Audit, and Taxation.</p>
//             <div className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-sm">View Jobs <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 12h14"/></svg></div>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // 2. AUTH
//   if (['login', 'signup', 'otp_verify'].includes(view)) {
//     const isRecruiter = activePortal === UserRole.RECRUITER;
//     const themeColor = isRecruiter ? 'blue-600' : 'emerald-500';
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
//         <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
//           <div className={`bg-${themeColor} p-12 text-white text-center relative`}>
//             <button onClick={() => setView('portal_select')} className="absolute left-8 top-12 opacity-60 hover:opacity-100 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
//             <h1 className="text-3xl font-black tracking-tight">{isRecruiter ? 'Recruiter Login' : 'Candidate Login'}</h1>
//           </div>
//           <div className="p-12">
//             {view === 'otp_verify' ? (
//               <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
//                 <p className="text-sm text-slate-500 font-medium">OTP sent to <span className="font-bold text-slate-800">{tempUser.mobile}</span></p>
//                 <input autoFocus maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center text-4xl font-black tracking-[1rem] bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl outline-none" placeholder="0000" />
//                 {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
//                 <button type="submit" className={`w-full bg-${themeColor} text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm`}>Verify OTP</button>
//               </form>
//             ) : (
//               <form onSubmit={view === 'login' ? handleLoginSubmit : handleSignupSubmit} className="space-y-6">
//                 {view === 'signup' && (
//                   <div>
//                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
//                     <input name="name" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="E.g. Rahul" />
//                   </div>
//                 )}
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile (Mandatory)</label>
//                   <input name="mobile" required type="tel" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="+91 99999 00000" />
//                 </div>
//                 {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
//                 <button type="submit" className={`w-full bg-${themeColor} text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-sm`}>{view === 'login' ? 'Get OTP' : 'Sign Up'}</button>
//                 <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="w-full text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase mt-4">{view === 'login' ? "New Here? Sign Up" : "Member? Sign In"}</button>
//               </form>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // 3. DASHBOARD
//   return (
//     <div className="min-h-screen bg-slate-50">
//       <Navbar user={currentUser} onLogout={handleLogout} onNavigate={(v) => setView(v as any)} />
      
//       <main className="max-w-7xl mx-auto px-6 py-12">
//         {/* RECRUITER */}
//         {view === 'dashboard' && currentUser?.role === UserRole.RECRUITER && (
//           <div className="space-y-8">
//             <div className="flex justify-between items-end">
//               <div>
//                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hiring Console</h2>
//                 <p className="text-slate-500 font-bold mt-1">Managing talent for ID: {currentUser.mobile}</p>
//               </div>
//               <button onClick={() => setView('post')} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest">Publish New Role</button>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               <RecruiterJobsList recruiterId={currentUser.id} setSelectedJob={setSelectedJob} setView={setView as any} />
//             </div>
//           </div>
//         )}

//         {/* CANDIDATE */}
//         {view === 'dashboard' && currentUser?.role === UserRole.REQUESTOR && (
//           <div className="space-y-8">
//             {/* Tabs for Discovery vs Applications */}
//             <div className="flex bg-slate-200 p-1.5 rounded-3xl w-full max-w-md mx-auto mb-10">
//               <button onClick={() => setCandidateTab('jobs')} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${candidateTab === 'jobs' ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>Find Jobs</button>
//               <button onClick={() => setCandidateTab('applications')} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${candidateTab === 'applications' ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>Applied Jobs</button>
//             </div>

//             {/* FIND JOBS VIEW */}
//             {candidateTab === 'jobs' && (
//             <div className="space-y-8">
//               <div>
//                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Opportunities Hub</h2>
//                 <p className="text-slate-500 font-bold mt-1">Verified: {currentUser.mobile}</p>
//               </div>
//               <div className="grid grid-cols-1 gap-6">
//                 <CandidateJobsList setSelectedJob={setSelectedJob} setView={setView as any} />
//               </div>
//             </div>
//             )}

//             {/* APPLIED JOBS VIEW */}
//             {candidateTab === 'applications' && (
//             <div className="space-y-8">
//               <div>
//                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Applications</h2>
//                 <p className="text-slate-500 font-bold mt-1">Track your applications</p>
//               </div>
//               <div className="grid grid-cols-1 gap-6">
//                 {myApplications.map(app => {
//                   // Optionally fetch job details from DB if needed
//                   // For now, show jobId: {app.jobId}
//                   return (
//                     <div key={app.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
//                       <div className="flex flex-col lg:flex-row justify-between gap-8">
//                         <div className="flex-1">
//                           <h3 className="text-3xl font-black text-slate-900 mb-1">Job Title Not Found</h3>
//                           <p className="text-sm text-slate-500 font-bold">Unknown • Unknown</p>
//                           <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ${getStatusColor(app.applicationStatus)}`}>
//                             {app.applicationStatus}
//                           </div>
//                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 pt-4 border-t border-slate-100 mt-6">
//                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p><p className="text-sm font-bold text-slate-800">{app.experience}</p></div>
//                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected</p><p className="text-sm font-black text-blue-600">₹{app.expectedCTC} LPA</p></div>
//                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notice</p><p className="text-sm font-bold text-slate-800">{app.noticePeriod}</p></div>
//                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pref. City</p><p className="text-sm font-bold text-slate-800">{app.preferredLocation}</p></div>
//                           </div>
//                           <div>
//                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expertise</p>
//                             <div className="flex flex-wrap gap-2">
//                               {(app.expertise || '').split(',').filter(Boolean).map((tag, i) => (
//                                 <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-100 uppercase tracking-tight">{tag.trim()}</span>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                         <div className="lg:w-1/3 space-y-4 bg-slate-50 p-6 rounded-3xl flex items-center justify-end">
//                           <button onClick={() => handleWithdraw(app.id)} className="text-[11px] font-black px-4 py-2.5 rounded-xl border bg-red-50 text-red-600 hover:bg-red-100">Withdraw Application</button>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//                 {myApplications.length === 0 && (
//                   <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest">No Applications Found</div>
//                 )}
//               </div>
//             </div>
//             )}
//           </div>
//         )}
//         {/* JOB FORMS */}
//         {view === 'post' && (
//           <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
//             <h2 className="text-4xl font-black text-blue-600 tracking-tight uppercase mb-8">Publish New Role</h2>
//             <form onSubmit={handlePostJob} className="space-y-8">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div className="md:col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label><input name="title" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold" /></div>
//                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Firm</label><input name="company" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold" /></div>
//                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label><select name="location" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold max-h-48 overflow-y-auto">{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
//               </div>
//               <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl uppercase tracking-[0.2em] text-sm">Deploy Job Posting</button>
//             </form>
//           </div>
//         )}

//         {view === 'apply' && selectedJob && (
//            <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl relative">
//             <div className="mb-10 pb-8 border-b border-slate-100">
//                 <h2 className="text-4xl font-black text-emerald-500 tracking-tight uppercase">Direct Application</h2>
//                 <p className="text-slate-500 font-bold mt-1">Applying for <span className="text-slate-900">{selectedJob.title}</span></p>
//             </div>
//             <form onSubmit={handleApply} className="space-y-8">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Professional Level</label>
//                   <select name="status" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold">
//                     <option value="Working Professional">Working Professional</option>
//                     <option value="Student">Student</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Experience (Years)</label>
//                   <input name="experience" required type="number" step="0.5" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold" placeholder="E.g. 2.5" />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expected Salary (LPA)</label>
//                   <input name="expectedCTC" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold" placeholder="E.g. 12.0" />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notice Period</label>
//                   <select name="noticePeriod" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold">
//                     {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Preferred Base City</label>
//                   <select name="preferredLocation" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold max-h-48 overflow-y-auto">
//                     {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
//                   </select>
//                 </div>
//               </div>
//               <div>
//                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expertise (GST, Audit, etc.)</label>
//                  <input name="expertise" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none font-bold" />
//               </div>
//               <textarea name="coverLetter" required rows={4} className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl outline-none font-medium text-slate-700" placeholder="Brief pitch to recruiter..."/>
//               <button type="submit" className={`w-full ${isSubmitting ? 'bg-slate-400' : 'bg-emerald-500 shadow-emerald-500/20'} text-white font-black py-6 rounded-3xl transition-all shadow-2xl uppercase tracking-[0.2em] text-sm`}>
//                 {isSubmitting ? 'Syncing...' : 'Confirm Submission'}
//               </button>
//             </form>
//           </div>
//         )}
//       {toast && <Toast message={toast} />}
//       </main>
//     </div>
//   );
// };

// export default App;
