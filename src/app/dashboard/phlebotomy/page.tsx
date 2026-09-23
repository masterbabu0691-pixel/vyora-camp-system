"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PhlebotomyPage() {
  // Pulls only patients who have finished the Doctor stage
  const { data, mutate, isLoading } = useSWR('/api/employees?queue=phlebotomy', fetcher, { refreshInterval: 5000 });
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Track checkboxes for each patient row inline
  const [collections, setCollections] = useState<Record<string, { blood: boolean, urine: boolean }>>({});

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Sample Collection...</div>;
  const employees = data?.employees || [];

  // Smart Search Bar
  const filteredEmployees = employees.filter((emp: any) => 
    (emp.name && emp.name.toLowerCase().includes(search.toLowerCase())) || 
    (emp.empCode && emp.empCode.toLowerCase().includes(search.toLowerCase())) ||
    (emp.uhid && emp.uhid.toLowerCase().includes(search.toLowerCase())) ||
    (emp.contactNo && emp.contactNo.includes(search))
  );

  const handleToggle = (id: string, type: 'blood' | 'urine') => {
    setCollections(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: !prev[id]?.[type] }
    }));
  };

  const handleSaveAndNext = async (emp: any) => {
    setSavingId(emp.id);
    const bloodCollected = collections[emp.id]?.blood || false;
    const urineCollected = collections[emp.id]?.urine || false;

    // Submits exactly to your backend route
    await fetch("/api/phlebotomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: emp.id, bloodCollected, urineCollected })
    });

    mutate(); // Instantly refresh the queue, removing the patient
    setSavingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Phlebotomy / Sample Collection</h1>
          <p className="text-gray-500 mt-1">Collect samples and forward directly to the Laboratory Queue.</p>
        </div>
        <div className="bg-[#002642] text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2">
          <span>Waiting:</span>
          <span className="text-teal-300 text-lg">{employees.length}</span>
        </div>
      </div>

      {/* Smart Search Bar */}
      <input 
        type="text" 
        placeholder="Search by Patient Name, Employee ID, UHID, or Phone..." 
        className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-[#008C8C] focus:ring-0 shadow-sm font-semibold outline-none transition"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Collection Checklist</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEmployees.length === 0 ? (
              <tr><td colSpan={3} className="p-12 text-center text-gray-500 font-semibold">No patients found in queue.</td></tr>
            ) : (
              filteredEmployees.map((emp: any) => {
                const isBlood = collections[emp.id]?.blood || false;
                const isUrine = collections[emp.id]?.urine || false;

                return (
                  <tr key={emp.id} className="hover:bg-teal-50/30 transition">
                    <td className="p-4">
                      <p className="font-bold text-[#002642] text-lg uppercase">{emp.name}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">
                        <span className="font-bold text-[#008C8C]">{emp.uhid}</span> | SR: {emp.serialNo}
                      </p>
                      
                      {/* CHERRY RED WARNINGS */}
                      <div className="mt-2 text-[11px] font-bold space-y-0.5">
                        {!isBlood && <p className="text-[#D2042D]">Blood Sample collection pending</p>}
                        {!isUrine && <p className="text-[#D2042D]">Urine collection pending</p>}
                      </div>
                    </td>
                    
                    <td className="p-4 text-center space-x-6">
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-[#008C8C] focus:ring-[#008C8C] cursor-pointer" 
                          checked={isBlood} onChange={() => handleToggle(emp.id, 'blood')} />
                        <span className="ml-2 font-bold text-[#002642]">Blood</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-[#008C8C] focus:ring-[#008C8C] cursor-pointer" 
                          checked={isUrine} onChange={() => handleToggle(emp.id, 'urine')} />
                        <span className="ml-2 font-bold text-[#002642]">Urine</span>
                      </label>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleSaveAndNext(emp)}
                        disabled={savingId === emp.id}
                        className="bg-[#008C8C] text-white px-6 py-2.5 rounded-xl font-bold shadow hover:bg-teal-600 disabled:opacity-50 transition"
                      >
                        {savingId === emp.id ? "Saving..." : "Save & Next →"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}