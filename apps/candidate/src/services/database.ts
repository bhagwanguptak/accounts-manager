console.log('[DATABASE] Loading database service file...');

/**
 * USER HELPERS
 */

import { Pool, QueryResult } from 'pg';
import { JobPosting, Application, User, UserRole, ApplicationStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const getUserByMobile = async (mobile: string): Promise<User | null> => {
  try {
    const result = await getPool().query(
      `SELECT id, name, mobile, email, role FROM users WHERE mobile = $1`,
      [mobile]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error getting user by mobile:', error);
    throw error;
  }
};

export const getUserForLogin = async (identifier: string): Promise<any> => {
  try {
    const result = await getPool().query(
      `SELECT id, name, mobile, email, role, expertise, experience,
       status AS "employmentStatus",
       password_hash

       FROM users 
       WHERE mobile = $1 OR email = $1`,
      [identifier]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error getting user for login:', error);
    throw error;
  }
};
export async function deleteJobById(jobId: string) {
  // 1️⃣ Check if job exists
  const check = await getPool().query(
    `SELECT id, status FROM jobs WHERE id = $1`,
    [jobId]
  );
    const dbCheck = await getPool().query(
    `SELECT current_database(), current_schema()`
  );
  console.log('[DB CHECK]', dbCheck.rows[0]);

  console.log('[JOB CHECK]', check.rowCount, check.rows);



  if (check.rowCount === 0) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  if (check.rows[0].status === 'DELETED') {
    return { ok: false, reason: 'ALREADY_DELETED' };
  }

  // 2️⃣ Soft delete
  await getPool().query(
    `
    UPDATE jobs
    SET status = 'DELETED',
        updated_at = NOW()
    WHERE id = $1
    `,
    [jobId]
  );

  return { ok: true };
}






export const createUser = async (user: {
  name: string;
  mobile: string;
  email?: string | null;
  role: string;
}): Promise<User> => {
  try {
    const id = uuidv4();

    const result = await getPool().query(
      `
      INSERT INTO users (id, name, mobile, email, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, mobile, email, role
      `,
      [
        id,
        user.name,
        user.mobile,
        user.email ?? null,
        user.role,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[DATABASE] Error creating user:', error);
    throw error;
  }
};


export const createUserWithPassword = async (user: User, passwordHash: string): Promise<User> => {
  try {
    const result = await getPool().query(
      `INSERT INTO users (id, name, mobile, email, role, expertise, experience, status, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, mobile, email, role, expertise, experience, status`,
      [
        user.id,
        user.name,
        user.mobile,
        user.email,
        user.role,
        user.expertise ? JSON.stringify(user.expertise) : null,
        user.experience,
        user.employmentStatus,
        passwordHash
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('[DATABASE] Error creating user with password:', error);
    throw error;
  }
};

export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }

    const useSSL =
      process.env.DB_SSL === "true" ||
      process.env.DB_SSL === "1";

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}


// Test connection
getPool().on('error', (err) => {
  console.error('[DATABASE ERROR]', err);
});

/**
 * DATABASE INITIALIZATION & MIGRATIONS
 */

export const initializeDatabase = async () => {
  try {
    console.log('[DATABASE] Initializing database schema...');

    // Check connection and existing tables for debugging
    try {
      const client = await getPool().connect();
      const dbInfo = await client.query('SELECT current_database(), current_user');
      console.log(`[DATABASE] Connected to '${dbInfo.rows[0].current_database}' as '${dbInfo.rows[0].current_user}'`);
      
      const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
      console.log(`[DATABASE] Current tables found: ${tables.rows.map(r => r.table_name).join(', ') || 'None'}`);
      client.release();
    } catch (err) {
      console.error('[DATABASE] Connection check failed:', err);
    }

    // Create tables if they don't exist
    await getPool().query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recruiter_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        requirements TEXT[],
        salary VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (recruiter_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL,
        candidate_id UUID NOT NULL,
        candidate_name VARCHAR(255) NOT NULL,
        candidate_mobile VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'applied',
        experience VARCHAR(100),
        salary_expectation VARCHAR(100),
        notice_period VARCHAR(100),
        location VARCHAR(255),
        expertise TEXT[],
        cover_letter TEXT,
        applied_at TIMESTAMP DEFAULT NOW(),
        withdrawn_at TIMESTAMP,
        is_withdrawn BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (candidate_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS admin_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL,
        logger_enabled BOOLEAN DEFAULT true,
        max_candidate_edits INTEGER DEFAULT 3,
        max_days_for_edit INTEGER DEFAULT 7,
        allow_rejected_reapply BOOLEAN DEFAULT false,
        app_name VARCHAR(255) DEFAULT 'AccuHire',
        app_version VARCHAR(50) DEFAULT '1.0.0',
        app_description TEXT,
        app_logo_url VARCHAR(500),
        primary_color VARCHAR(10) DEFAULT '#3B82F6',
        secondary_color VARCHAR(10) DEFAULT '#10B981',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS rejected_candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID NOT NULL,
        job_id UUID NOT NULL,
        rejected_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (candidate_id) REFERENCES users(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        UNIQUE(candidate_id, job_id)
      );

      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
      CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_rejected_candidate_job ON rejected_candidates(candidate_id, job_id);
    `);

    console.log('[DATABASE] Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('[DATABASE] Initialization failed:', error);
    throw error;
  }

};

/**
 * JOB OPERATIONS
 */

export const createJob = async (
  recruiterId: string,
  job: Omit<JobPosting, 'id' | 'createdAt'>
): Promise<JobPosting> => {
  try {
    const result = await getPool().query(
      `INSERT INTO jobs (
        recruiter_id, title, company, location, category, description, requirements, salary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, recruiter_id as "recruiterId", title, company, location, category, 
               description, requirements, salary, created_at as "createdAt"`,
      [
        recruiterId,
        job.title,
        job.company,
        job.location,
        job.category,
        job.description,
       job.requirements ?? '[]',
        job.salary,
      ]
    );
    console.log('[DATABASE] Job created:', result.rows[0].id);
    return result.rows[0] as JobPosting;
  } catch (error) {
    console.error('[DATABASE] Error creating job:', error);
    throw error;
  }
};

export const getJobById = async (jobId: string): Promise<JobPosting | null> => {
  try {
    const result = await getPool().query(
      `SELECT id, recruiter_id as "recruiterId", title, company, location, category,
              description, requirements, salary, created_at as "createdAt"
       FROM jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error getting job:', error);
    throw error;
  }
};

export const getJobsByRecruiter = async (recruiterId: string): Promise<JobPosting[]> => {
  try {
    const result = await getPool().query(
      `SELECT id, recruiter_id as "recruiterId", title, company, location, category,
              description, requirements, salary, created_at as "createdAt"
       FROM jobs WHERE recruiter_id = $1 ORDER BY created_at DESC`,
      [recruiterId]
    );
    return result.rows as JobPosting[];
  } catch (error) {
    console.error('[DATABASE] Error getting recruiter jobs:', error);
    throw error;
  }
};

export const getAllJobs = async (): Promise<JobPosting[]> => {
  try {
    const result = await getPool().query(
      `SELECT *
    FROM jobs
    WHERE status = 'ACTIVE'
    ORDER BY created_at DESC;`

    );
    return result.rows as JobPosting[];
  } catch (error) {
    console.error('[DATABASE] Error getting all jobs:', error);
    throw error;
  }
};

export const updateJob = async (
  jobId: string,
  updates: Partial<JobPosting>
): Promise<JobPosting | null> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.company !== undefined) {
      fields.push(`company = $${paramCount++}`);
      values.push(updates.company);
    }
    if (updates.location !== undefined) {
      fields.push(`location = $${paramCount++}`);
      values.push(updates.location);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.requirements !== undefined) {
      fields.push(`requirements = $${paramCount++}`);
      values.push(updates.requirements);
    }
    if (updates.salary !== undefined) {
      fields.push(`salary = $${paramCount++}`);
      values.push(updates.salary);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(jobId);

    const result = await getPool().query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, recruiter_id as "recruiterId", title, company, location, category,
                 description, requirements, salary, created_at as "createdAt"`,
      values
    );

    console.log('[DATABASE] Job updated:', jobId);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error updating job:', error);
    throw error;
  }
};

export const deleteJob = async (jobId: string): Promise<boolean> => {
  try {
    // Delete associated applications first
    await getPool().query('DELETE FROM applications WHERE job_id = $1', [jobId]);
    
    // Delete associated rejected candidates
    await getPool().query('DELETE FROM rejected_candidates WHERE job_id = $1', [jobId]);
    
    // Delete the job
    const result = await getPool().query('DELETE FROM jobs WHERE id = $1 RETURNING id', [jobId]);
    console.log('[DATABASE] Job deleted:', jobId);
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('[DATABASE] Error deleting job:', error);
    throw error;
  }
};

/**
 * APPLICATION OPERATIONS
 */


export const createApplication = async (
  jobId: string,
  candidateId: string,
  app: {
    experience?: string;
    expectedCTC?: string;
    noticePeriod?: string;
    preferredLocation?: string;
    expertise?: string[];
    coverLetter?: string;
  }
): Promise<Application> => {
  try {
    // 🔹 Fetch candidate details from DB
  const userRes = await getPool().query(
    `SELECT name, mobile, experience FROM users WHERE id = $1`,
    [candidateId]
  );

  const candidate = userRes.rows[0];
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const candidateName =
    candidate.name?.trim() ||
    `Candidate-${candidate.mobile?.slice(-4) || "User"}`;
    
    const result = await getPool().query(
      `INSERT INTO applications (
        job_id,
        candidate_id,
        candidate_name,
        candidate_mobile,
        experience,
        salary_expectation,
        notice_period,
        location,
        expertise,
        cover_letter,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING
        id,
        job_id AS "jobId",
        candidate_id AS "candidateId",
        candidate_name AS "candidateName",
        candidate_mobile AS "candidateMobile",
        experience,
        salary_expectation AS "expectedCTC",
        notice_period AS "noticePeriod",
        location AS "preferredLocation",
        expertise,
        cover_letter AS "coverLetter",
        status AS "applicationStatus",
        applied_at AS "appliedAt",
        is_withdrawn AS "isWithdrawn"`,
      [
        jobId,
        candidateId,
        candidateName,
        candidate.mobile,
        candidate.experience,
        app.expectedCTC ?? null,        // maps to salary_expectation
        app.noticePeriod ?? null,
        app.preferredLocation ?? null,  // maps to location
        app.expertise ?? [],
        app.coverLetter ?? null,
        'APPLIED',
      ]
    );


    console.log('[DATABASE] Application created:', result.rows[0].id);
    return result.rows[0] as Application;
  } catch (error) {
    console.error('[DATABASE] Error creating application:', error);
    throw error;
  }
};


export const getApplicationsByJob = async (jobId: string): Promise<Application[]> => {
  try {
    const result = await getPool().query(
      `SELECT id, job_id as "jobId", candidate_id as "candidateId", candidate_name as "candidateName",
              candidate_mobile as "candidateMobile", experience, salary_expectation as "salaryExpectation",
              notice_period as "noticePeriod", location, expertise, cover_letter as "coverLetter",
              status as "applicationStatus", applied_at as "appliedAt", is_withdrawn as "isWithdrawn"
       FROM applications WHERE job_id = $1 AND is_withdrawn = false ORDER BY applied_at DESC`,
      [jobId]
    );
    return result.rows as Application[];
  } catch (error) {
    console.error('[DATABASE] Error getting applications:', error);
    throw error;
  }
};

export const getAllApplications = async (): Promise<Application[]> => {
  try {
    const result = await getPool().query(
      `SELECT id, job_id as "jobId", candidate_id as "candidateId", candidate_name as "candidateName",
              candidate_mobile as "candidateMobile", experience, salary_expectation as "salaryExpectation",
              notice_period as "noticePeriod", location, expertise, cover_letter as "coverLetter",
              status as "applicationStatus", applied_at as "appliedAt", is_withdrawn as "isWithdrawn"
       FROM applications WHERE is_withdrawn = false ORDER BY applied_at DESC`
    );
    return result.rows as Application[];
  } catch (error) {
    console.error('[DATABASE] Error getting all applications:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (
  appId: string,
  status: ApplicationStatus
): Promise<Application | null> => {
  try {
    const result = await getPool().query(
      `UPDATE applications SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, job_id as "jobId", candidate_id as "candidateId", candidate_name as "candidateName",
                 candidate_mobile as "candidateMobile", experience, salary_expectation as "salaryExpectation",
                 notice_period as "noticePeriod", location, expertise, cover_letter as "coverLetter",
                 status as "applicationStatus", applied_at as "appliedAt", is_withdrawn as "isWithdrawn"`,
      [status, appId]
    );
    console.log('[DATABASE] Application status updated:', appId, 'to', status);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error updating application:', error);
    throw error;
  }
};

export const withdrawApplication = async (
  applicationId: string,
  candidateId: string
) => {
  await getPool().query(
    `
    UPDATE applications
    SET is_withdrawn = true,
        withdrawn_at = NOW(),
        status = 'Withdrawn'
    WHERE id = $1
      AND candidate_id = $2
      AND is_withdrawn = false
    `,
    [applicationId, candidateId]
  );
};



/**
 * CANDIDATE OPERATIONS
 */

export const getCandidateApplications = async (candidateId: string): Promise<Application[]> => {
  try {
    const result = await getPool().query(
      `SELECT id, job_id as "jobId", candidate_id as "candidateId", candidate_name as "candidateName",
              candidate_mobile as "candidateMobile", experience, salary_expectation as "salaryExpectation",
              notice_period as "noticePeriod", location, expertise, cover_letter as "coverLetter",
              status as "applicationStatus", applied_at as "appliedAt", is_withdrawn as "isWithdrawn"
       FROM applications WHERE candidate_id = $1 ORDER BY applied_at DESC`,
      [candidateId]
    );
    return result.rows as Application[];
  } catch (error) {
    console.error('[DATABASE] Error getting candidate applications:', error);
    throw error;
  }
};

export const getCandidateProfile = async (userId: string) => {
  const result = await getPool().query(
    `SELECT id, name, mobile, email, experience, notice_period, preferred_location, expertise
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};
export const updateCandidateProfile = async (
  userId: string,
  updates: {
    name?: string;
    email?: string;
    experience?: string;
    noticePeriod?: string;
    preferredLocation?: string;
    expertise?: string[];
  }
) => {
  const result = await getPool().query(
    `UPDATE users SET
      name = COALESCE(NULLIF($1, ''), name),
      email = COALESCE(NULLIF($2, ''), email),
      experience = COALESCE(NULLIF($3, ''), experience),
      notice_period = COALESCE(NULLIF($4, ''), notice_period),
      preferred_location = COALESCE(NULLIF($5, ''), preferred_location),
      expertise = COALESCE($6, expertise),
      updated_at = NOW()
     WHERE id = $7
     RETURNING id, name, mobile, email, experience, notice_period, preferred_location, expertise`,
    [
      updates.name ?? '',
      updates.email ?? '',
      updates.experience ?? '',
      updates.noticePeriod ?? '',
      updates.preferredLocation ?? '',
      updates.expertise ?? null,
      userId,
    ]
  );

  return result.rows[0];
};



/**
 * REJECTION TRACKING
 */

export const markCandidateAsRejected = async (
  candidateId: string,
  jobId: string
): Promise<boolean> => {
  try {
    await getPool().query(
      `INSERT INTO rejected_candidates (candidate_id, job_id) VALUES ($1, $2)
       ON CONFLICT (candidate_id, job_id) DO NOTHING`,
      [candidateId, jobId]
    );
    console.log('[DATABASE] Candidate marked as rejected:', candidateId, 'for job:', jobId);
    return true;
  } catch (error) {
    console.error('[DATABASE] Error marking rejection:', error);
    throw error;
  }
};

export const isCandidateRejected = async (
  candidateId: string,
  jobId: string
): Promise<boolean> => {
  try {
    const result = await getPool().query(
      `SELECT id FROM rejected_candidates WHERE candidate_id = $1 AND job_id = $2`,
      [candidateId, jobId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[DATABASE] Error checking rejection status:', error);
    throw error;
  }
};

/**
 * OTP OPERATIONS
 */

export const createOtp = async (
  identifier: string,
  code: string
): Promise<void> => {
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clean up old OTPs
    await getPool().query(
      'DELETE FROM otps WHERE identifier = $1',
      [identifier]
    );

    await getPool().query(
      `INSERT INTO otps (identifier, code, expires_at)
       VALUES ($1, $2, $3)`,
      [identifier, code, expiresAt]
    );

    console.log('[DATABASE] OTP created for:', identifier, 'expires at', expiresAt);
  } catch (error) {
    console.error('[DATABASE] Error creating OTP:', error);
    throw error;
  }
};


export const getOtp = async (
  identifier: string,
  code: string
): Promise<{ id: string; expires_at: Date } | null> => {
  try {
    const result = await getPool().query(
      `SELECT id, expires_at
       FROM otps
       WHERE identifier = $1 AND code = $2
       ORDER BY expires_at DESC
       LIMIT 1`,
      [identifier, code]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error getting OTP:', error);
    throw error;
  }
};


export const deleteOtp = async (id: string): Promise<void> => {
  await getPool().query('DELETE FROM otps WHERE id = $1', [id]);
};

/**
 * ADMIN SETTINGS
 */

export const getAdminSettings = async (adminId: string): Promise<any> => {
  try {
    const result = await getPool().query(
      `SELECT * FROM admin_settings WHERE admin_id = $1`,
      [adminId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DATABASE] Error getting settings:', error);
    throw error;
  }
};

export const updateAdminSettings = async (
  adminId: string,
  settings: any
): Promise<boolean> => {
  try {
    const {
      loggerEnabled,
      maxCandidateEdits,
      maxDaysForEdit,
      allowRejectedReapply,
      appName,
      appVersion,
      appDescription,
      appLogoUrl,
      primaryColor,
      secondaryColor,
    } = settings;

    await getPool().query(
      `
      INSERT INTO admin_settings (
        admin_id,
        logger_enabled,
        max_candidate_edits,
        max_days_for_edit,
        allow_rejected_reapply,
        app_name,
        app_version,
        app_description,
        app_logo_url,
        primary_color,
        secondary_color
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (admin_id)
      DO UPDATE SET
        logger_enabled = EXCLUDED.logger_enabled,
        max_candidate_edits = EXCLUDED.max_candidate_edits,
        max_days_for_edit = EXCLUDED.max_days_for_edit,
        allow_rejected_reapply = EXCLUDED.allow_rejected_reapply,
        app_name = EXCLUDED.app_name,
        app_version = EXCLUDED.app_version,
        app_description = EXCLUDED.app_description,
        app_logo_url = EXCLUDED.app_logo_url,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        updated_at = NOW()
      `,
      [
        adminId,
        loggerEnabled ?? true,
        maxCandidateEdits ?? 3,
        maxDaysForEdit ?? 7,
        allowRejectedReapply ?? false,
        appName ?? 'AccuHire',
        appVersion ?? '1.0.0',
        appDescription ?? '',
        appLogoUrl ?? null,
        primaryColor ?? '#3B82F6',
        secondaryColor ?? '#10B981',
      ]
    );

    console.log('[DATABASE] Admin settings upserted for:', adminId);
    return true;
  } catch (error) {
    console.error('[DATABASE] Error updating settings:', error);
    throw error;
  }
};

/**
 * LOGGER CONDITION CHECK
 */

export const shouldLoggerBeEnabled = async (adminId: string): Promise<boolean> => {
  try {
    const settings = await getAdminSettings(adminId);
    return settings?.logger_enabled ?? true;
  } catch (error) {
    console.error('[DATABASE] Error checking logger status:', error);
    return true; // Default to true if error
  }
};

/**
 * CLEANUP & CONNECTION
 */

export const closeDatabase = async () => {
  try {
    await getPool().end();
    console.log('[DATABASE] Connection pool closed');
  } catch (error) {
    console.error('[DATABASE] Error closing connection:', error);
  }
};

// Auto-initialize database in development environment
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().catch((err) => {
    console.error('[DATABASE] Failed to auto-initialize database:', err);
  });
}

export default pool;
