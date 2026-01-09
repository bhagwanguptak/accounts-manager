import React, { useEffect, useState } from "react";
import { Application, ApplicationStatus } from "@accuhire/shared";
import { JobPosting } from "../types";
import { api } from "../api";

interface RecruiterApplicationsListProps {
  job: JobPosting;
  updateStatus: (
    applicationId: string,
    status: ApplicationStatus
  ) => void;
  getStatusColor: (status: ApplicationStatus) => string;
}

export const RecruiterApplicationsList: React.FC<
  RecruiterApplicationsListProps
> = ({ job, updateStatus, getStatusColor }) => {
  const [applications, setApplications] = useState<Application[]>([]);

   useEffect(() => {
    if (!job?.id) return;

    const fetchApplications = async () => {
      try {
        const apps = await api.getApplicationsByJob(job.id);
        setApplications(apps);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      }
    };

    fetchApplications();
  }, [job.id]);

  if (!job) {
    return (
      <div className="text-center text-slate-400 font-bold py-10">
        Job not found
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {applications.map((app) => (
        <div
          key={app.id}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-6 hover:shadow-xl transition"
        >
          {/* Candidate Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {app.candidateName}
              </h3>
              <p className="text-slate-600 font-bold text-sm">
                {app.expertise} • {app.experience}
              </p>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-2">
                Applied on {new Date(app.appliedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <span
                className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest border ${getStatusColor(
                  app.applicationStatus
                )}`}
              >
                {app.applicationStatus}
              </span>

              <select
                value={app.applicationStatus}
                onChange={(e) =>
                  updateStatus(
                    app.id,
                    e.target.value as ApplicationStatus
                  )
                }
                className="px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm"
              >
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-slate-700">
            <div>Current CTC: {app.currentCTC}</div>
            <div>Expected CTC: {app.expectedCTC}</div>
            <div>Preferred Location: {app.preferredLocation}</div>
            <div>Notice Period: {app.noticePeriod}</div>
          </div>

          {/* Cover Letter */}
          <div className="text-sm text-slate-600 leading-relaxed">
            <span className="font-black text-slate-900">Cover Letter:</span>{" "}
            {app.coverLetter}
          </div>
        </div>
      ))}

      {applications.length === 0 && (
        <div className="text-center text-slate-400 font-bold py-10">
          No applications yet
        </div>
      )}
    </div>
  );
};
export default RecruiterApplicationsList;