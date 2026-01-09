'use client';

import React from 'react';
import { User ,UserRole} from '../../src/types';
export type ViewType = 'dashboard' | 'post' | 'jobs' | 'applications';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onNavigate
}) => {
  const isRecruiter = user?.role === UserRole.RECRUITER;

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="h-16 flex items-center justify-between px-4">
        <div
          className="font-black cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          Accu
          <span className="text-emerald-500">
            {isRecruiter ? 'Hire' : 'Careers'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold"> {user?.name || (user?.role ? user.role : 'Admin')}</span>

          <button
            onClick={onLogout}
            className="text-red-600 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
