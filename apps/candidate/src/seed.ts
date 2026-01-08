import dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRole, JobCategory } from '@accuhire/shared';
import { 
  initializeDatabase,
  createUserWithPassword,
  createJob, 
  createApplication, 
  closeDatabase 
} from './services/database';

const seed = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    console.log('Creating users...');
    
    // Recruiter
    const recruiterId = randomUUID();
    const recruiterPassword = await bcrypt.hash('recruiter123', 10);
    await createUserWithPassword({
      id: recruiterId,
      name: 'Demo Recruiter',
      mobile: '9999999999',
      email: 'recruiter@accuhire.com',
      role: UserRole.RECRUITER,
      status: 'Active',
      expertise: [],
      experience: '10'
    } as any, recruiterPassword);

    // Candidate
    const candidateId = randomUUID();
    const candidatePassword = await bcrypt.hash('candidate123', 10);
    await createUserWithPassword({
      id: candidateId,
      name: 'Rahul Sharma',
      mobile: '8888888888',
      email: 'rahul@accuhire.com',
      role: UserRole.CANDIDATE,
      status: 'Active',
      expertise: ['React', 'Node.js'],
      experience: '3'
    } as any, candidatePassword);

    console.log('Creating jobs...');
    const job = await createJob(recruiterId, {
      recruiterId: recruiterId,
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'Bangalore',
      category: 'Engineering' as JobCategory,
      description: 'We are looking for an experienced React developer to join our team.',
      requirements: ['React', 'TypeScript', 'Tailwind CSS'],
      salary: '25-35 LPA'
    });

    console.log('Creating applications...');
    await createApplication(job.id, candidateId, {
      candidateName: 'Rahul Sharma',
      candidateMobile: '8888888888',
      experience: '3',
      expectedCTC: '30',
      noticePeriod: '30 Days',
      preferredLocation: 'Bangalore',
      expertise: 'React, Node.js',
      coverLetter: 'I am very interested in this role.',
      applicationStatus: 'Applied'
    } as any);

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await closeDatabase();
  }
};

seed();