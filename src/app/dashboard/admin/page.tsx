"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("margins");
  const [saving, setSaving] = useState(false);

  // Future state for margins (Will connect to API next)
  const [margins, setMargins] = useState({ top: "4.5cm", bottom: "2cm", left: "1.5cm", right: "1.5cm" });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-[#002642] uppercase tracking-wide">Super Admin Console</h1>
        <p className="text-gray-500 mt-1 font-semibold">Modify core system parameters, print constraints, and clinical test rules.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab("margins")}
          className={`px-6 py-2.5 rounded-t-lg font-bold transition ${activeTab === "margins" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          📄 Print Margins
        </button>
        <button 
          onClick={() => setActiveTab("tests")}
          className={`px-6 py-2.5 rounded-t-lg font-bold transition ${activeTab === "tests" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          🔬 Master Test Config
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2.5 rounded-t-lg font-bold transition ${activeTab === "users" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          👥 User Access (RBAC)
        </button>
      </div>

      {/* TAB 1: MARGINS */}
      {activeTab === "margins" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#008C8C] mb-6">Global Letterhead Print Constraints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Top Margin (Logo Gap)</label>
                <input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.top} onChange={e => setMargins({...margins, top: e.target.value})} placeholder="e.g. 4.5cm" />
                <p className="text-[10px] text-gray-400 mt-1">Leave space for the physical printed letterhead header.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bottom Margin</label>
                <input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.bottom} onChange={e => setMargins({...margins, bottom: e.target.value})} placeholder="e.g. 2cm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Left Margin</label>
                  <input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.left} onChange={e => setMargins({...margins, left: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Right Margin</label>
                  <input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.right} onChange={e => setMargins({...margins, right: e.target.value})} />
                </div>
              </div>
              
              <button className="bg-[#008C8C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-teal-600 transition mt-4 w-full">
                Save Global Margins
              </button>
            </div>

            {/* Visual Preview Box */}
            <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center p-8 relative h-80">
              <div className="absolute top-0 w-full bg-blue-100/50 flex items-center justify-center text-blue-800 font-bold text-xs" style={{ height: margins.top }}>
                Letterhead Header Area ({margins.top})
              </div>
              <div className="bg-white w-full h-full border shadow-sm flex items-center justify-center text-gray-400 font-bold text-sm">
                Safe Printable Content Area
              </div>
              <div className="absolute bottom-0 w-full bg-blue-100/50 flex items-center justify-center text-blue-800 font-bold text-xs" style={{ height: margins.bottom }}>
                Footer ({margins.bottom})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TESTS (Placeholder for next step) */}
      {activeTab === "tests" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
           <h2 className="text-xl font-bold text-[#008C8C] mb-4">Master Clinical Test Configuration</h2>
           <p className="text-gray-500 font-semibold mb-6">Add, remove, or modify the required diagnostic tests and reference ranges globally.</p>
           
           <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
             <p className="text-gray-400 font-bold">API Route required to load dynamic tests from database...</p>
           </div>
        </div>
      )}

      {/* TAB 3: USERS (Placeholder for next step) */}
      {activeTab === "users" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
           <h2 className="text-xl font-bold text-[#008C8C] mb-4">Role-Based Access Control</h2>
           <p className="text-gray-500 font-semibold mb-6">Manage staff accounts, assign roles (Doctor, Phlebotomy, Reception), and reset passwords.</p>
           
           <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
             <p className="text-gray-400 font-bold">API Route required to load users from database...</p>
           </div>
        </div>
      )}

    </div>
  );
}