import React, { useEffect, useState } from "react";
import { JobPosting } from "../types";
import { ViewType } from "../types";
import { api } from "../api";

interface RecruiterJobsListProps {
    role: 'ADMIN' | 'RECRUITER';
  setSelectedJob: (job: JobPosting) => void;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  handleEditJob: (job: JobPosting) => void;
}

export const RecruiterJobsList: React.FC<RecruiterJobsListProps> = ({
  role,
  setSelectedJob,
  setView,
  handleEditJob,
}) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  useEffect(() => {
      let isMounted = true;

      const fetchJobs = async () => {
        try {
          const jobs =
            role === 'ADMIN'
              ? await api.getAdminJobs()
              : await api.getRecruiterJobs();

          if (isMounted) setJobs(jobs);
        } catch (error) {
          console.error('Failed to fetch jobs', error);
        }
      };

      fetchJobs();

      return () => {
        isMounted = false;
      };
    }, [role]);


  return (
    <>
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-2xl transition-all"
        >
          {/* LEFT */}
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-900">
              {job.title}
            </h3>
            <p className="text-slate-600 mb-4 font-bold text-sm">
              {job.company} • {job.location}
            </p>

            <div className="flex flex-wrap gap-2">
              {(job.requirements || []).map((req, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-tight border border-indigo-100"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 md:border-l border-slate-100 md:pl-8">
            <button
              onClick={() => {
                setSelectedJob(job);
                setView("applications");
              }}
              className="bg-slate-100 text-slate-700 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-200 hover:bg-slate-200 transition"
            >
              View
            </button>

            <button
              onClick={() => handleEditJob(job)}
              className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition"
            >
              Edit
            </button>
          </div>
        </div>
      ))}

      {jobs.length === 0 && (
        <div className="text-center text-slate-400 font-bold py-10">
          No jobs posted yet
        </div>
      )}
    </>
  );
};
export default RecruiterJobsList;   