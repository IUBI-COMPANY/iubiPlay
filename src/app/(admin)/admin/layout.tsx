import React from 'react';
import { AdminShell } from '@/src/components/admin/admin_shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
