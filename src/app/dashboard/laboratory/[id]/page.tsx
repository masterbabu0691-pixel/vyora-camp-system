"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// The strict 10 tests required by the final letterhead report
const REQUIRED_TESTS = [
  { key: "Blood Group", label: "Blood Group", placeholder: "e.g., O+ve", unit: "" },
  { key: "Hb", label: "Hemoglobin (Hb)", placeholder: "e.g., 14.5", unit: "g/dL" },
  { key: "WBC", label: "WBC Count", placeholder: "e.g., 6500", unit: "cells/cumm" },
  { key: "Platelets", label: "Platelet Count", placeholder: "e.g., 2.5", unit: "lakhs/cumm" },
  { key: "ESR", label: "ESR", placeholder: "e.g., 12", unit: "mm/hr" },
  { key: "SGPT", label: "SGPT", placeholder: "e.g., 35", unit: "U/L" },
  { key: "Creatinine", label: "Serum Creatinine", placeholder: "e.g., 0.9", unit: "mg/dL" },
  { key: "RBS", label: "Random Blood Sugar", placeholder: "e.g., 95", unit: "mg/dL" },
  { key: "Widal", label: "Widal Profile", placeholder: "e.g., Negative", unit: "" },
  { key: "Urine", label: "Urine R/M", placeholder: "e.g., Normal", unit: "" },
];

export default function LabEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();

  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Format payload to strictly match what the Final Report expects
    const labResults = REQUIRED_TESTS.map(test => ({
      testName: test.key, // Crucial: Locks the exact string so getLab() works flawlessly
      result: results[test.key] || "",
      unit: test.unit,
      flag: "NORMAL" 
    })).filter(test => test.result !== ""); // Only save tests that have data entered

    const res = await fetch("/api/laboratory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, labResults })
    });

    if (res.ok) {
      alert("Laboratory records locked and saved successfully!");
      router.push("/dashboard/laboratory");
    } else {
      alert("Failed to save lab records.");
    }
    setSaving(false);
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Patient File...</div>;
  const emp = data?.employee;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-[#002642] p-6 rounded-2xl shadow-md text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Laboratory Investigation Panel</h1>
          <p className="text-teal-300 text-sm mt-1 font-semibold uppercase tracking-widest">Target: {emp?.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-teal-300 font-bold">{emp?.uhid}</p>
          <p className="text-xs text-gray-400 font-mono">SR: {emp?.serialNo} | {emp?.camp?.client?.name}</p>
        </div>
      </div>

      {/* FIXED 10-TEST FORM */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-3 mb-6">Diagnostic Data Entry</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {REQUIRED_TESTS.map((test) => (
            <div key={test.key} className="flex flex-col">
              <label className="text-xs font-bold text-[#002642] uppercase tracking-wider mb-2">
                {test.label} {test.unit && <span className="text-gray-400 normal-case tracking-normal">({test.unit})</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={test.placeholder}
                  className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold text-gray-900 outline-none focus:border-[#008C8C] focus:ring-1 focus:ring-[#008C8C] transition"
                  value={results[test.key] || ""}
                  onChange={(e) => handleInputChange(test.key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-10 pt-6 border-t flex justify-end gap-4">
          <button onClick={() => router.push('/dashboard/laboratory')} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-[#008C8C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-teal-600 transition disabled:opacity-50">
            {saving ? "Saving Data..." : "Submit to Doctor Review Queue"}
          </button>
        </div>
      </div>

    </div>
  );
}