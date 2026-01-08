import React, { useEffect, useState } from 'react';
import { JobPosting, Application } from '@accuhire/shared';
// import * as database from '../../../../apps/candidate/src/services/database';

interface CandidateJobsListProps {
  jobs: JobPosting[];
  setSelectedJob: (job: JobPosting) => void;
  setView: (v: string) => void;
  myApplications?: Application[];
}

export const CandidateJobsList: React.FC<CandidateJobsListProps> = ({ jobs,setSelectedJob, setView, myApplications = [] }) => {
  
  return (
    <>
      {jobs.map(job => {
        const alreadyApplied = myApplications.some(a => a.jobId === job.id);
        return (
          <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-2xl transition-all">
            <div className="flex-1"> 
              <h3 className="text-2xl font-black text-slate-900">{job.title}</h3>
              <p className="text-slate-600 mb-4 font-bold text-sm">{job.company} • {job.location}</p>
              <div className="flex flex-wrap gap-2">
                {(job.requirements || []).map((req, i) => (
                  <span key={i} className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-tight border border-emerald-100">{req}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-8 md:border-l border-slate-100 md:pl-8">
              {alreadyApplied ? (
                <button
                  disabled
                  className="
                    flex items-center gap-2
                    bg-slate-100 text-slate-400
                    px-6 py-3 rounded-xl
                    text-[11px] font-black uppercase tracking-widest
                    border border-slate-200
                    cursor-not-allowed
                  "
                >
                  ✓ Applied
                </button>
              ) : (
                <button
                  onClick={() => { setSelectedJob(job); setView('apply'); }}
                  className="
                    bg-emerald-500 text-white
                    px-8 py-3 rounded-xl
                    text-[11px] font-black uppercase tracking-widest
                    shadow-md hover:shadow-xl
                    hover:bg-emerald-600
                    transition-all
                    active:scale-95
                  "
                >
                  Apply Now
                </button>
              )}

            </div>
          </div>
        );
      })}
    </>
  );
};
