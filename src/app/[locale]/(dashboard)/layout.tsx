'use client';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
} from '@/components/ui/sidebar';

/**
 * This layout applies to all routes in the (dashboard) route group.
 * The SidebarProvider and AppSidebar will persist across navigations
 * within dashboard pages, preventing remounting and maintaining state.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}











