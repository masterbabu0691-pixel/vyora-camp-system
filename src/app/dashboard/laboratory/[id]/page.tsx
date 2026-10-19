"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LabEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();

  // Fetch the patient file
  const { data: empData, isLoading: empLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  
  // NEW: Dynamically fetch all tests from the Super Admin's TestMaster database
  const { data: testData, isLoading: testsLoading } = useSWR('/api/tests', fetcher);

  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const activeTests = testData?.tests?.filter((t: any) => t.isActive) || [];

    // Filter out blank inputs based on the dynamically fetched tests
    const labResults = activeTests.map((test: any) => ({
      testName: test.testName,
      result: results[test.testName] || "",
      unit: test.unit || "",
      flag: "NORMAL" 
    })).filter((test: any) => test.result !== ""); 

    try {
      const res = await fetch("/api/laboratory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, labResults })
      });

      const responseData = await res.json();

      if (res.ok) {
        alert("Laboratory records locked and saved successfully!");
        router.push("/dashboard/laboratory");
      } else {
        alert("Server failed to save: " + (responseData.error || "Unknown Error. Check backend logs."));
      }
    } catch (error) {
      alert("Network Error: Failed to contact the server.");
    }
    
    setSaving(false);
  };

  if (empLoading || testsLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Patient Data & Lab Configuration...</div>;
  
  const emp = empData?.employee;
  
  // Filter out only the active tests that the Super Admin enabled
  const activeTests = testData?.tests?.filter((t: any) => t.isActive) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-end border-b pb-3 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Diagnostic Data Entry</h2>
          <span className="text-xs font-bold text-[#008C8C] bg-teal-50 px-2 py-1 rounded">{activeTests.length} Active Tests Configured</span>
        </div>
        
        {activeTests.length === 0 ? (
          <div className="text-center py-8 text-amber-600 font-bold bg-amber-50 rounded-xl border border-amber-200">
            No active tests found. Please ask the Super Admin to configure tests in the Test Config panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {activeTests.map((test: any) => (
              <div key={test.id} className="flex flex-col">
                <label className="text-xs font-bold text-[#002642] uppercase tracking-wider mb-2">
                  {test.testName} {test.unit && <span className="text-gray-400 normal-case tracking-normal">({test.unit})</span>}
                </label>
                <input
                  type="text"
                  placeholder={test.normalRange ? `Normal: ${test.normalRange}` : `Enter result...`}
                  className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold text-gray-900 outline-none focus:border-[#008C8C] focus:ring-1 focus:ring-[#008C8C] transition"
                  value={results[test.testName] || ""}
                  onChange={(e) => handleInputChange(test.testName, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t flex justify-end gap-4">
          <button onClick={() => router.push('/dashboard/laboratory')} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || activeTests.length === 0} className="bg-[#008C8C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-teal-600 transition disabled:opacity-50">
            {saving ? "Saving Data..." : "Submit to Doctor Review"}
          </button>
        </div>
      </div>
    </div>
  );
}