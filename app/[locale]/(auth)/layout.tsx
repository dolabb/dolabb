import { ReactNode } from 'react';

/**
 * Auth Layout
 * Used for authentication pages (login, signup, forgot-password, reset-password)
 * This layout provides a clean, centered design without the main navigation
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white">
      {children}
    </div>
  );
}

