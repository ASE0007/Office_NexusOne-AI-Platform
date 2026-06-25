"use client";
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { cn } from '@/utils/cn';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]")}>
        <Navbar />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}