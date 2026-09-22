"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PhlebotomyPage() {
  const { data, mutate, isLoading } = useSWR('/api/employees?queue=phlebo', fetcher, { refreshInterval: 5000 });
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Track checkboxes for each patient row
  const [collections, setCollections] = useState<Record<string, { blood: boolean, urine: boolean }>>({});

  if (isLoading) return <div className="p-8 font-bold text-rose-800 animate-pulse">Loading Sample Collection...</div>;
  const employees = data?.employees || [];

  // The Search Engine (Name, ID, or Contact No)
  const filteredEmployees = employees.filter((emp: any) => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.empCode.toLowerCase().includes(search.toLowerCase()) ||
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

    await fetch("/api/phlebotomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: emp.id, bloodCollected, urineCollected })
    });

    mutate(); // Instantly refresh the queue
    setSavingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-rose-900">Phlebotomy / Sample Collection</h1>
          <p className="text-gray-500 mt-1">Collect samples and forward to the Laboratory.</p>
        </div>
        <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-lg font-bold">Waiting: {employees.length}</div>
      </div>

      {/* Smart Search Bar */}
      <input 
        type="text" 
        placeholder="Search by Patient Name, Employee ID, or Phone..." 
        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-rose-500 focus:ring-0 shadow-sm text-lg font-semibold"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-rose-900 text-white">
              <th className="p-4 font-semibold">Patient Details</th>
              <th className="p-4 font-semibold text-center">Checklist</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEmployees.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No patients found.</td></tr>
            ) : (
              filteredEmployees.map((emp: any) => {
                const isBlood = collections[emp.id]?.blood || false;
                const isUrine = collections[emp.id]?.urine || false;

                return (
                  <tr key={emp.id} className="hover:bg-rose-50">
                    <td className="p-4">
                      <p className="font-bold text-rose-900 text-lg">{emp.name}</p>
                      <p className="text-sm text-gray-600">ID: {emp.empCode} | Ph: {emp.contactNo}</p>
                      
                      {/* CHERRY RED WARNINGS */}
                      <div className="mt-2 text-xs font-bold space-y-1">
                        {!isBlood && <p className="text-[#D2042D]">Blood Sample collection pending</p>}
                        {!isUrine && <p className="text-[#D2042D]">Urine collection pending</p>}
                      </div>
                    </td>
                    
                    <td className="p-4 text-center space-x-6">
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 rounded text-rose-600 focus:ring-rose-500 cursor-pointer" 
                          checked={isBlood} onChange={() => handleToggle(emp.id, 'blood')} />
                        <span className="ml-2 font-bold text-gray-700">Blood</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 rounded text-rose-600 focus:ring-rose-500 cursor-pointer" 
                          checked={isUrine} onChange={() => handleToggle(emp.id, 'urine')} />
                        <span className="ml-2 font-bold text-gray-700">Urine</span>
                      </label>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleSaveAndNext(emp)}
                        disabled={savingId === emp.id}
                        className="bg-rose-600 text-white px-6 py-3 rounded-md font-bold shadow hover:bg-rose-700 disabled:opacity-50 transition"
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