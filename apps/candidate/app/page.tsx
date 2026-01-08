"use client";

import React, { useState } from 'react';
import { UserRole } from '@accuhire/shared';
import CandidateApp from '../src/CandidateApp';
import RecruiterApp from '../src/RecruiterApp';
import AdminApp from '../src/AdminApp';

export default function GatewayPage() {
  const [selectedPortal, setSelectedPortal] = useState<UserRole | 'admin' | null>(null);

  if (selectedPortal === 'admin') {
    return (
      <div>
        <button
          onClick={() => setSelectedPortal(null)}
          className="fixed top-6 left-6 z-50 bg-red-600 text-white px-6 py-2 rounded-full text-sm font-black"
        >
          Switch Portal
        </button>
        <AdminApp />
      </div>
    );
  }

  if (selectedPortal === UserRole.RECRUITER) {
    return (
      <div>
        <button
          onClick={() => setSelectedPortal(null)}
          className="fixed top-6 left-6 z-50 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-black"
        >
          Switch Portal
        </button>
        <RecruiterApp />
      </div>
    );
  }

  if (selectedPortal === UserRole.CANDIDATE) {
    return (
      <div>
        <button
          onClick={() => setSelectedPortal(null)}
          className="fixed top-6 left-6 z-50 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-black"
        >
          Switch Portal
        </button>
        <CandidateApp />
      </div>
    );
  }

  // Gateway - Portal Selection
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="col-span-full text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2">AccuHire</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Specialized Accounting Talent Exchange</p>
        </div>
        <button
          onClick={() => setSelectedPortal(UserRole.RECRUITER)}
          className="group relative bg-blue-600 p-10 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(37,99,235,0.4)] overflow-hidden border-2 border-transparent hover:border-blue-400"
        >
          <h2 className="text-3xl font-black text-white mb-3">I am a<br/>Recruiter</h2>
          <p className="text-blue-100 font-medium text-sm opacity-80 mb-6">Hire verified CA & tax experts</p>
          <div className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-xs">
            Enter Portal{' '}
            <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </div>
        </button>
        <button
          onClick={() => setSelectedPortal(UserRole.CANDIDATE)}
          className="group relative bg-emerald-500 p-10 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] overflow-hidden border-2 border-transparent hover:border-emerald-300"
        >
          <h2 className="text-3xl font-black text-white mb-3">I am a<br/>Candidate</h2>
          <p className="text-emerald-50 font-medium text-sm opacity-80 mb-6">Discover premium accounting roles</p>
          <div className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-xs">
            View Jobs{' '}
            <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </div>
        </button>
        <button
          onClick={() => setSelectedPortal('admin')}
          className="group relative bg-red-600 p-10 rounded-[3rem] text-left transition-all hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(220,38,38,0.4)] overflow-hidden border-2 border-transparent hover:border-red-400"
        >
          <h2 className="text-3xl font-black text-white mb-3">I am<br/>Admin</h2>
          <p className="text-red-100 font-medium text-sm opacity-80 mb-6">System control center</p>
          <div className="flex items-center gap-3 text-white font-black uppercase tracking-widest text-xs">
            Control Panel{' '}
            <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}