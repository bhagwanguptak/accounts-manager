// packages/shared/src/types.ts

export enum UserRole {
  ADMIN = "ADMIN",
  RECRUITER = "RECRUITER",
  CANDIDATE = "CANDIDATE",
}


/* =======================
   JOBS
======================= */

export enum JobCategory {
  TAX = "Taxation",
  AUDIT = "Audit & Assurance",
  ARTICLESHIP = "Articleship",
  FINANCE = "Corporate Finance",
  ACCOUNTING = "General Accounting",
  COMPLIANCE = "Legal & Compliance",
}

export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  category: JobCategory;
  description?: string | null;
  requirements?: string[] | null;
  location: string;
  salary?: string | null;
  createdAt: string;
}

/* =======================
   USERS (PROFILE READY)
======================= */

export type EmploymentStatus = "Working Professional" | "Student";

export interface User {
  id: string;
  name: string | null;
  mobile: string | null;
  email?: string | null;
  role: UserRole;

  experience?: string | null;
  noticePeriod?: string | null;
  preferredLocation?: string | null;
  expertise?: string[] | null;
  employmentStatus?: EmploymentStatus | null; // ✅ ADD THIS
}

/*------------Views*-----------*/

export type ViewType =
  | 'login'
  | 'signup'
  | 'otp_verify'
  | 'dashboard'
  | 'apply'
  | 'forgot_password'
  | 'applications' 
  | 'post'        // ✅ ADD
  | 'edit'; 


/* =======================
   APPLICATIONS
======================= */

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFER_EXTENDED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  currentCTC: string;
  expectedCTC: string;
  candidateName: string;
  candidateMobile: string;
  preferredLocation: string;
  experience?: string | null;
  salaryExpectation?: string | null;
  noticePeriod?: string | null;
  location?: string | null;
  expertise?: string[] | null;
  coverLetter?: string | null;

  applicationStatus: ApplicationStatus;
  appliedAt: string;
  isWithdrawn: boolean;
}
