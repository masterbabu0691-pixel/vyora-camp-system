"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedCampId, setSelectedCampId] = useState("all");
  
  // Fetch clients for the dropdown
  const { data: clientData } = useSWR('/api/clients', fetcher);
  
  // Fetch stats depending on which camp the Admin selects
  const { data, isLoading } = useSWR(`/api/stats?campId=${selectedCampId}`, fetcher, { refreshInterval: 5000 });

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(session => {
      if (session?.user) setUser(session.user);
    });
  }, []);

  const displayName = user?.name ? user.name.split(" ")[0] : "Loading...";
  const isAdmin = user?.role === "SUPER_ADMIN";
  const clients = clientData?.clients || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Good morning, {displayName}!</h1>
          <p className="text-gray-600 mt-2 text-lg">Role: <span className="font-bold text-[#008C8C]">{user?.role || "..."}</span></p>
        </div>
        
        {/* CLIENT FILTER (Only really matters for Admins, but safe to show) */}
        <div className="bg-white p-2 rounded-lg border-2 border-[#008C8C] shadow-sm">
          <label className="text-xs font-bold text-gray-500 uppercase px-2">Active Tracking View</label>
          <select 
            className="w-full p-2 bg-transparent font-bold text-[#002642] outline-none"
            value={selectedCampId}
            onChange={e => setSelectedCampId(e.target.value)}
          >
            <option value="all">🌐 All Global Camps (Mixed)</option>
            {clients.map((client: any) => client.camps.map((camp: any) => (
              <option key={camp.id} value={camp.id}>{client.name} - {camp.campName}</option>
            )))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Registered</span>
          <span className="text-3xl font-black text-[#002642] mt-2">{isLoading ? "..." : (data?.total || 0)}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-amber-500">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Doctor Queue</span>
          <span className="text-3xl font-black text-amber-500 mt-2">{isLoading ? "..." : (data?.doctor || 0)}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-blue-500">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Lab Queue</span>
          <span className="text-3xl font-black text-blue-500 mt-2">{isLoading ? "..." : (data?.lab || 0)}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-purple-500">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Final Review</span>
          <span className="text-3xl font-black text-purple-500 mt-2">{isLoading ? "..." : (data?.review || 0)}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-green-500">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Completed</span>
          <span className="text-3xl font-black text-green-500 mt-2">{isLoading ? "..." : (data?.completed || 0)}</span>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-[#002642] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(isAdmin || user?.role === "RECEPTION") && (
            <Link href="/dashboard/reception" className="bg-[#002642] text-white p-5 rounded-xl shadow-md hover:bg-[#003865] transition text-left font-semibold text-lg block">+ Register New Employee</Link>
          )}
          {(isAdmin || user?.role === "DOCTOR") && (
            <Link href="/dashboard/doctor" className="bg-white border-2 border-[#008C8C] text-[#008C8C] p-5 rounded-xl shadow-sm hover:bg-[#008C8C]/5 transition font-semibold text-lg block">Open Doctor View</Link>
          )}
          {(isAdmin || user?.role === "LAB_TECH") && (
            <Link href="/dashboard/laboratory" className="bg-white border-2 border-[#008C8C] text-[#008C8C] p-5 rounded-xl shadow-sm hover:bg-[#008C8C]/5 transition font-semibold text-lg block">Open Laboratory View</Link>
          )}
        </div>
      </div>
    </div>
  );
}