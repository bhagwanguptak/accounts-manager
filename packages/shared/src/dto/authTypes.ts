import { UserRole } from '../types';

export type CreateUserInput = {
  name?: string | null;
  mobile: string;
  email?: string | null;
  role: UserRole;
};
