"use client"; 
import { useUIStore } from '@/store/uiStore'; 
import { Sidebar } from '@/components/dashboard/Sidebar'; 
import { Navbar } from '@/components/dashboard/Navbar'; 
import { cn } from '@/utils/cn'; 
export default function DashboardLayout({ children }: { children: React.ReactNode }) { 
const { sidebarCollapsed } = useUIStore(); 
return (<div className="flex"><Sidebar /><div className="flex-1"><Navbar /><main>{children}</main></div></div>); }
