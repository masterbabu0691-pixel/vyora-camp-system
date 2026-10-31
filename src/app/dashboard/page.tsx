"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedCampId, setSelectedCampId] = useState("all");
  
  const { data: clientData } = useSWR('/api/clients', fetcher);
  
  // Refreshes every 5 seconds for real-time live tracking
  const { data, isLoading } = useSWR(`/api/stats?campId=${selectedCampId}`, fetcher, { refreshInterval: 5000 });

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(session => {
      if (session?.user) setUser(session.user);
    });
  }, []);

  const displayName = user?.name ? user.name.split(" ")[0] : "Loading...";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const clients = clientData?.clients || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Camp Monitor Dashboard</h1>
          <p className="text-gray-600 mt-2 text-lg">Welcome back, <span className="font-bold text-[#008C8C]">{displayName}</span> (Role: {user?.role || "..."})</p>
        </div>
        
        {/* CLIENT FILTER */}
        <div className="bg-white p-2 rounded-lg border-2 border-[#008C8C] shadow-sm min-w-[300px]">
          <label className="text-xs font-bold text-gray-500 uppercase px-2">Active Tracking View</label>
          <select 
            className="w-full p-2 bg-transparent font-bold text-[#002642] outline-none cursor-pointer"
            value={selectedCampId}
            onChange={e => setSelectedCampId(e.target.value)}
          >
            <option value="all">🌐 All Global Camps (Mixed)</option>
            {clients.map((client: any) => (
              <optgroup key={client.id} label={`🏢 ${client.name}`}>
                {client.camps.map((camp: any) => (
                  <option key={camp.id} value={camp.id}>{camp.campName}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* CORE PIPELINE STATS */}
      <div>
        <h2 className="text-lg font-black text-[#002642] uppercase tracking-wider mb-4 border-b pb-2">Core Clinical Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Roster</span>
            <span className="text-2xl font-black text-[#002642] mt-1">{isLoading ? "..." : (data?.core?.total || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-teal-500">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Pre-Registered</span>
            <span className="text-2xl font-black text-teal-600 mt-1">{isLoading ? "..." : (data?.core?.preRegistered || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-red-500">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Phlebotomy Queue</span>
            <span className="text-2xl font-black text-red-500 mt-1">{isLoading ? "..." : (data?.core?.phlebo || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-amber-500">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Doctor Queue</span>
            <span className="text-2xl font-black text-amber-500 mt-1">{isLoading ? "..." : (data?.core?.doctor || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-purple-500">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Final Review</span>
            <span className="text-2xl font-black text-purple-500 mt-1">{isLoading ? "..." : (data?.core?.review || 0)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-l-4 border-l-green-500">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Completed</span>
            <span className="text-2xl font-black text-green-500 mt-1">{isLoading ? "..." : (data?.core?.completed || 0)}</span>
          </div>
        </div>
      </div>

      {/* SPECIALIZED DIAGNOSTIC FUNNEL */}
      <div>
        <h2 className="text-lg font-black text-[#002642] uppercase tracking-wider mb-4 border-b pb-2">Diagnostic Stations Real-Time Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {[
            { key: 'xray', title: '🩻 X-Ray Station' },
            { key: 'ecg', title: '❤️ ECG Station' },
            { key: 'pft', title: '🫁 PFT Station' },
            { key: 'audio', title: '🎧 Audiometry Station' }
          ].map(station => (
            <div key={station.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-gray-50 p-3 border-b font-black text-gray-700 uppercase tracking-wider text-sm text-center">
                {station.title}
              </div>
              <div className="grid grid-cols-3 divide-x text-center p-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Pending</p>
                  <p className="text-lg font-black text-amber-500">{isLoading ? "-" : (data?.diagnostics?.[station.key]?.pending || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Arrived</p>
                  <p className="text-lg font-black text-blue-500">{isLoading ? "-" : (data?.diagnostics?.[station.key]?.arrived || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Done</p>
                  <p className="text-lg font-black text-green-500">{isLoading ? "-" : (data?.diagnostics?.[station.key]?.done || 0)}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="pt-4">
        <h2 className="text-lg font-black text-[#002642] uppercase tracking-wider mb-4 border-b pb-2">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/dashboard/reception" className="bg-[#002642] text-white p-4 rounded-xl shadow-md hover:bg-[#003865] transition text-center font-bold text-sm block">Reception Desk</Link>
          <Link href="/dashboard/phlebotomy" className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl shadow-sm hover:bg-red-100 transition text-center font-bold text-sm block">Phlebotomy Lab</Link>
          <Link href="/dashboard/doctor" className="bg-amber-50 text-amber-700 border border-amber-200 p-4 rounded-xl shadow-sm hover:bg-amber-100 transition text-center font-bold text-sm block">Doctor Desk</Link>
          <Link href="/dashboard/review" className="bg-purple-50 text-purple-700 border border-purple-200 p-4 rounded-xl shadow-sm hover:bg-purple-100 transition text-center font-bold text-sm block">Final Sign-Off</Link>
        </div>
      </div>

    </div>
  );
}