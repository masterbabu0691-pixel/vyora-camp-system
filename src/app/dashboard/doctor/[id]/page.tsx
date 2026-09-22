"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { use } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ExaminationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();
  
  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [saving, setSaving] = useState(false);
  
  // The blank medical form
  const [form, setForm] = useState({
    pastHistory: "Nil", comorbidities: "Nil",
    heartRate: "", bloodPress: "", spO2: "",
    eyeRight: "6/6", eyeLeft: "6/6", colorBlindness: "Normal",
    ent: "Normal", oral: "Normal", headNeck: "Normal",
    lungsChest: "Normal", cardiovascular: "Normal", skinVaricose: "Normal"
  });

  if (isLoading) return <div className="p-8 font-bold animate-pulse">Loading Patient Data...</div>;
  const emp = data?.employee;
  if (!emp) return <div className="p-8 font-bold text-red-500">Patient not found.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const res = await fetch("/api/examinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, employeeId })
    });

    if (res.ok) {
      router.push("/dashboard/doctor"); // Kick them back to the queue
    } else {
      alert("Failed to save examination.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Patient Header */}
      <div className="bg-[#002642] text-white p-6 rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{emp.name}</h1>
          <p className="text-gray-300">ID: {emp.empCode} | Age: {emp.age} | Sex: {emp.sex}</p>
        </div>
        <div className="text-right bg-white/10 p-3 rounded-lg">
          <p className="text-sm text-gray-300 uppercase tracking-wide font-bold">Vitals Check</p>
          <p className="font-semibold text-lg">BMI: <span className="text-amber-400">{emp.vitals?.bmi}</span></p>
        </div>
      </div>

      {/* Medical Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700">Past History</label>
            <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.pastHistory} onChange={e => setForm({...form, pastHistory: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Co-Morbidities</label>
            <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.comorbidities} onChange={e => setForm({...form, comorbidities: e.target.value})} />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-[#008C8C] mb-4">Systematic Examination</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700">Heart Rate (bpm)</label>
              <input required type="number" className="mt-1 w-full rounded-md border border-gray-300 p-2" placeholder="e.g. 72" value={form.heartRate} onChange={e => setForm({...form, heartRate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Blood Pressure</label>
              <input required type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" placeholder="e.g. 120/80" value={form.bloodPress} onChange={e => setForm({...form, bloodPress: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">SpO2 (%)</label>
              <input required type="number" className="mt-1 w-full rounded-md border border-gray-300 p-2" placeholder="e.g. 98" value={form.spO2} onChange={e => setForm({...form, spO2: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-[#008C8C] mb-4">Physical Examination</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700">Right Eye</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.eyeRight} onChange={e => setForm({...form, eyeRight: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Left Eye</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.eyeLeft} onChange={e => setForm({...form, eyeLeft: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Color Blindness</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.colorBlindness} onChange={e => setForm({...form, colorBlindness: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">ENT</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.ent} onChange={e => setForm({...form, ent: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Lungs & Chest</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.lungsChest} onChange={e => setForm({...form, lungsChest: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Cardiovascular</label>
              <input type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2" value={form.cardiovascular} onChange={e => setForm({...form, cardiovascular: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="button" onClick={() => router.push("/dashboard/doctor")} className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-[#008C8C] text-white py-3 rounded-md hover:bg-[#006b6b] font-bold text-lg shadow-md transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Examination & Send to Lab"}
          </button>
        </div>

      </form>
    </div>
  );
}