import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import { UserRole } from '@shared/schema';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { userProfile } = useAuth();

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  children: React.ReactNode;
  role: UserRole;
  fallback?: React.ReactNode;
}

export function RequireRole({ children, role, fallback = null }: RequireRoleProps) {
  return (
    <RoleGate allowedRoles={[role]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

// Specific role components for convenience
export function RequireSeeker({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RequireRole role="seeker" fallback={fallback}>{children}</RequireRole>;
}

export function RequireEmployer({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RequireRole role="employer" fallback={fallback}>{children}</RequireRole>;
}

export function RequireAdmin({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RequireRole role="admin" fallback={fallback}>{children}</RequireRole>;
}
