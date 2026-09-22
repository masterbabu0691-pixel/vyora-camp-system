"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (!session || Object.keys(session).length === 0) {
          router.push('/');
        } else {
          setIsAuthenticated(true);
          setUserRole(session.user.role); // Save their specific role!
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  const linkClass = (path: string) => 
    `block px-4 py-2.5 rounded-md text-sm font-medium transition ${
      pathname === path ? "bg-[#008C8C] text-white shadow" : "hover:bg-white/10 text-gray-200"
    }`;

  if (!isAuthenticated) return <div className="h-screen flex items-center justify-center font-bold text-2xl text-[#002642]">Loading Security Profile...</div>;

  const isAdmin = userRole === "SUPER_ADMIN";

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#002642] text-white flex flex-col shadow-xl print:hidden">
        <div className="p-6 text-center border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-wide">Vyora</h2>
          <p className="text-xs text-[#008C8C] mt-1 font-semibold tracking-widest uppercase">Camp System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard Home</Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard Home</Link>
          
          {/* Admin Management Tools */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Management</div>
              <Link href="/dashboard/clients" className={linkClass("/dashboard/clients")}>🏢 Client Manager</Link>
            </>
          )}{/* Admin Management Tools */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Management</div>
              <Link href="/dashboard/clients" className={linkClass("/dashboard/clients")}>🏢 Client Manager</Link>
              <Link href="/dashboard/pre-register" className={linkClass("/dashboard/pre-register")}>📝 Pre-Registration</Link>
              <Link href="/dashboard/reports" className={linkClass("/dashboard/reports")}>📊 Client Reports</Link>
            </>
          )}
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Workflows</div>
          
          {/* Conditional Menu Items Based on Role */}
          {(isAdmin || userRole === "RECEPTION") && (
            <Link href="/dashboard/reception" className={linkClass("/dashboard/reception")}>1. Reception Registration</Link>
          )}
          
          {(isAdmin || userRole === "DOCTOR") && (
            <Link href="/dashboard/doctor" className={linkClass("/dashboard/doctor")}>2. Doctor Queue</Link>
          )}
          
          {(isAdmin || userRole === "PHLEBO") && (
            <Link href="/dashboard/phlebotomy" className={linkClass("/dashboard/phlebotomy")}>3. Sample Collection</Link>
          )}
          
          {(isAdmin || userRole === "LAB_TECH") && (
            <Link href="/dashboard/laboratory" className={linkClass("/dashboard/laboratory")}>4. Laboratory Queue</Link>
          )}
          
          {(isAdmin || userRole === "DOCTOR") && (
            <Link href="/dashboard/review" className={linkClass("/dashboard/review")}>5. Final Review & Print</Link>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2.5 rounded-md hover:bg-red-500/20 text-red-400 text-sm font-bold transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50 print:p-0 print:bg-white">
        {children}
      </main>
      
    </div>
  );
}