"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Fetch current logged-in user data
  const { data: session, status } = useSession();

  // 1. Define all routes and the specific roles allowed to see them
  const allNavItems = [
    { name: "Dashboard Home", href: "/dashboard", icon: "📊", roles: ["SUPERADMIN", "ADMIN", "RECEPTION", "PHLEBOTOMIST", "DOCTOR", "TECHNICIAN"] },
    { name: "Client Manager", href: "/dashboard/clients", icon: "🏢", roles: ["SUPERADMIN", "ADMIN"] },
    { name: "Pre-Registration", href: "/dashboard/pre-register", icon: "📝", roles: ["SUPERADMIN", "ADMIN", "RECEPTION"] },
    { name: "Reception", href: "/dashboard/reception", icon: "📋", roles: ["SUPERADMIN", "ADMIN", "RECEPTION"] },
    { name: "Phlebotomy Queue", href: "/dashboard/phlebotomy", icon: "🩸", roles: ["SUPERADMIN", "ADMIN", "PHLEBOTOMIST"] },
    { name: "Doctor Queue", href: "/dashboard/doctor", icon: "🩺", roles: ["SUPERADMIN", "ADMIN", "DOCTOR"] },
    { name: "Laboratory Queue", href: "/dashboard/laboratory", icon: "🔬", roles: ["SUPERADMIN", "ADMIN", "TECHNICIAN"] },
    { name: "Review & Sign-Off", href: "/dashboard/review", icon: "📑", roles: ["SUPERADMIN", "ADMIN", "DOCTOR"] },
    { name: "Client Reports", href: "/dashboard/reports", icon: "📈", roles: ["SUPERADMIN", "ADMIN"] },
  ];

  // 2. Filter the navigation based on the user's actual role in the database
  const userRole = (session?.user as any)?.role || "RECEPTION"; 
  const authorizedNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#002642] text-white font-bold">Loading System...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden bg-[#002642] text-white p-4 flex justify-between items-center z-20 shadow-md sticky top-0">
        <div>
          <h1 className="text-xl font-bold tracking-wider">Vyora</h1>
          <p className="text-[#008C8C] text-[10px] font-bold tracking-widest leading-none">CAMP SYSTEM</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white focus:outline-none p-2 rounded hover:bg-gray-800 transition"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 📱 MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🚀 RESPONSIVE SIDEBAR (Now Role-Protected) */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-64 bg-[#002642] text-white flex flex-col h-screen shadow-2xl md:shadow-none`}>
        
        {/* DESKTOP LOGO */}
        <div className="p-6 border-b border-gray-800 hidden md:block">
          <h1 className="text-3xl font-black tracking-wider text-white">Vyora</h1>
          <p className="text-[#008C8C] text-xs font-bold tracking-widest mt-1">CAMP SYSTEM</p>
          <div className="mt-4 inline-block bg-teal-900 text-teal-300 text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase">
            ROLE: {userRole}
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {authorizedNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard');
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-[#008C8C] text-white shadow-md font-bold" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white font-medium"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-gray-800 bg-[#001e36]">
          <div className="mb-3 px-2 text-xs text-gray-500 font-medium truncate">
            {session?.user?.name || session?.user?.email}
          </div>
          <Link 
            href="/api/auth/signout"
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-bold text-sm">Log Out</span>
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-[calc(100vh-72px)] md:h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 scroll-smooth">
          {children}
        </main>
      </div>

    </div>
  );
}