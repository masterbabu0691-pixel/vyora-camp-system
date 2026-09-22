"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { use } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LabEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();
  
  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [saving, setSaving] = useState(false);
  
  // FSSAI required Lab Fields
  const [results, setResults] = useState({
    Hb: "", WBC: "", Platelets: "", ESR: "", SGPT: "", Creatinine: "", 
    Widal: "Negative", BloodGroup: "O+", RBS: "", UrineRM: "Normal"
  });

  if (isLoading) return <div className="p-8 font-bold animate-pulse">Loading Patient Data...</div>;
  const emp = data?.employee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/laboratory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, results })
    });
    if (res.ok) router.push("/dashboard/laboratory");
    else { alert("Failed to save."); setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-blue-900 text-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold">{emp?.name} - Lab Entry</h1>
        <p className="text-blue-200">ID: {emp?.empCode} | Age: {emp?.age}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(results).map((test) => (
            <div key={test}>
              <label className="block text-sm font-bold text-gray-700">{test}</label>
              {test === 'BloodGroup' ? (
                <select className="mt-1 w-full border p-2 rounded" value={results[test as keyof typeof results]} onChange={e => setResults({...results, [test]: e.target.value})}>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              ) : (
                <input required type="text" className="mt-1 w-full border p-2 rounded" value={results[test as keyof typeof results]} onChange={e => setResults({...results, [test]: e.target.value})} />
              )}
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition">
          {saving ? "Saving..." : "Save Lab Results & Send to Final Review"}
        </button>
      </form>
    </div>
  );
}