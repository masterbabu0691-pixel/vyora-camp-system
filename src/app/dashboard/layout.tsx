"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Deduplicated and Cleaned Navigation Links
const navItems = [
  { name: "Dashboard Home", href: "/dashboard", icon: "📊" },
  { name: "Client Manager", href: "/dashboard/clients", icon: "🏢" },
  { name: "Pre-Registration", href: "/dashboard/pre-register", icon: "📝" },
  { name: "Reception", href: "/dashboard/reception", icon: "📋" },
  { name: "Phlebotomy Queue", href: "/dashboard/phlebotomy", icon: "🩸" },
  { name: "Doctor Queue", href: "/dashboard/doctor", icon: "🩺" },
  { name: "Laboratory Queue", href: "/dashboard/laboratory", icon: "🔬" },
  { name: "Review & Sign-Off", href: "/dashboard/review", icon: "📑" },
  { name: "Client Reports", href: "/dashboard/reports", icon: "📈" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* 📱 MOBILE HEADER (Only visible on phones/tablets) */}
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

      {/* 📱 MOBILE OVERLAY (Darkens background when menu is open) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🚀 RESPONSIVE SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-64 bg-[#002642] text-white flex flex-col h-screen shadow-2xl md:shadow-none`}>
        
        {/* DESKTOP LOGO (Hidden on mobile) */}
        <div className="p-6 border-b border-gray-800 hidden md:block">
          <h1 className="text-3xl font-black tracking-wider text-white">Vyora</h1>
          <p className="text-[#008C8C] text-xs font-bold tracking-widest mt-1">CAMP SYSTEM</p>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard');
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)} // Auto-closes menu on mobile after click
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