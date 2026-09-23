"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DoctorEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();

  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [saving, setSaving] = useState(false);

  const [vitals, setVitals] = useState({ height: "", weight: "", bmi: "", heartRate: "", spO2: "", bloodPress: "" });
  const [exam, setExam] = useState({
    pastHistory: "Nil", comorbidities: "Nil", eyeRight: "6/6", eyeLeft: "6/6", colorBlindness: "Normal",
    ent: "Normal", oral: "Normal", headNeck: "Normal", lungsChest: "Clear", cardiovascular: "Normal S1 S2", skinVaricose: "Normal"
  });

  const emp = data?.employee;

  // AUTO-FILL DATA FROM RECEPTION
  useEffect(() => {
    if (emp) {
      setVitals({
        height: emp.vitals?.height?.toString() || "",
        weight: emp.vitals?.weight?.toString() || "",
        bmi: emp.vitals?.bmi?.toString() || "",
        heartRate: emp.vitals?.heartRate?.toString() || "",
        spO2: emp.vitals?.spO2?.toString() || "",
        bloodPress: emp.vitals?.bloodPress || ""
      });
      setExam({
        pastHistory: emp.examination?.pastHistory || "Nil",
        comorbidities: emp.examination?.comorbidities || "Nil",
        eyeRight: emp.examination?.eyeRight || "6/6",
        eyeLeft: emp.examination?.eyeLeft || "6/6",
        colorBlindness: emp.examination?.colorBlindness || "Normal",
        ent: emp.examination?.ent || "Normal",
        oral: emp.examination?.oral || "Normal",
        headNeck: emp.examination?.headNeck || "Normal",
        lungsChest: emp.examination?.lungsChest || "Clear",
        cardiovascular: emp.examination?.cardiovascular || "Normal S1 S2",
        skinVaricose: emp.examination?.skinVaricose || "Normal"
      });
    }
  }, [emp]);

  // LIVE BMI CALCULATION
  useEffect(() => {
    if (vitals.height && vitals.weight) {
      const hMeters = parseFloat(vitals.height) / 100;
      const wKg = parseFloat(vitals.weight);
      if (hMeters > 0 && wKg > 0) {
        setVitals(prev => ({ ...prev, bmi: (wKg / (hMeters * hMeters)).toFixed(1) }));
      }
    }
  }, [vitals.height, vitals.weight]);

  const handleSave = async () => {
    setSaving(true);
    
    // SAFE NUMBER PARSER: Fixes the database crash by sending valid Nulls instead of NaNs
    const safeNum = (val: string) => val === "" || isNaN(Number(val)) ? null : Number(val);

    const payload = {
      employeeId,
      vitals: {
        height: safeNum(vitals.height), 
        weight: safeNum(vitals.weight),
        bmi: safeNum(vitals.bmi), 
        heartRate: safeNum(vitals.heartRate),
        spO2: safeNum(vitals.spO2), 
        bloodPress: vitals.bloodPress || null,
      },
      examination: exam
    };

    try {
      const res = await fetch("/api/doctor", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Clinical Examination saved successfully!");
        router.push("/dashboard/doctor");
      } else {
        alert("Server failed to save. Ensure database schema is synced.");
      }
    } catch (e) {
      alert("Network error. Failed to save.");
    }
    setSaving(false);
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Patient File...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col gap-4">
      
      {/* COMPACT HEADER */}
      <div className="bg-[#002642] p-4 rounded-xl shadow-md text-white flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-wide">Doctor Examination Panel</h1>
          <p className="text-teal-300 text-xs font-semibold uppercase tracking-widest">{emp?.name} | {emp?.age || "-"} Yrs | {emp?.sex || "-"}</p>
        </div>
        <div className="text-right flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/doctor')} className="px-4 py-2 rounded-lg font-bold text-gray-300 hover:bg-gray-800 transition text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="bg-[#008C8C] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-teal-600 transition disabled:opacity-50 text-sm">
            {saving ? "Saving..." : "Save & Complete Check"}
          </button>
        </div>
      </div>

      {/* DENSE 3-COLUMN NO-SCROLL LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto pb-4">
        
        {/* COLUMN 1: VITALS (Blue Tint) */}
        <div className="bg-blue-50/50 p-4 rounded-xl shadow-sm border border-blue-100 h-fit">
          <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider border-b border-blue-200 pb-2 mb-3">1. Vitals & Measurements</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Height (cm)</label><input type="number" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-blue-400" value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Weight (kg)</label><input type="number" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-blue-400" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} /></div>
            <div className="col-span-2 bg-blue-100/50 p-2 rounded flex justify-between items-center"><span className="text-[10px] font-bold text-blue-700 uppercase">Auto-Calculated BMI</span><span className="text-base font-black text-blue-900">{vitals.bmi || "-"}</span></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Pulse (bpm)</label><input type="number" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-blue-400" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">SpO2 (%)</label><input type="number" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-blue-400" value={vitals.spO2} onChange={e => setVitals({...vitals, spO2: e.target.value})} /></div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Blood Pressure (mmHg)</label><input type="text" placeholder="120/80" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-blue-400" value={vitals.bloodPress} onChange={e => setVitals({...vitals, bloodPress: e.target.value})} /></div>
          </div>
        </div>

        {/* COLUMN 2: HISTORY & EYES (Amber Tint) */}
        <div className="bg-amber-50/50 p-4 rounded-xl shadow-sm border border-amber-100 h-fit space-y-4">
          <div>
            <h2 className="text-xs font-black text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-2 mb-3">2. Medical History</h2>
            <div className="space-y-2">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Past Medical History</label><input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-amber-400" value={exam.pastHistory} onChange={e => setExam({...exam, pastHistory: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Co-Morbidities</label><input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-amber-400" value={exam.comorbidities} onChange={e => setExam({...exam, comorbidities: e.target.value})} /></div>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-black text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-2 mb-3">3. Vision Check</h2>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Right Eye</label><input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-amber-400" value={exam.eyeRight} onChange={e => setExam({...exam, eyeRight: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Left Eye</label><input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-amber-400" value={exam.eyeLeft} onChange={e => setExam({...exam, eyeLeft: e.target.value})} /></div>
              <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Color Blindness</label><input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-amber-400" value={exam.colorBlindness} onChange={e => setExam({...exam, colorBlindness: e.target.value})} /></div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: SYSTEMIC (Teal Tint) */}
        <div className="bg-teal-50/50 p-4 rounded-xl shadow-sm border border-teal-100 h-fit">
          <h2 className="text-xs font-black text-teal-800 uppercase tracking-wider border-b border-teal-200 pb-2 mb-3">4. Systemic Examination</h2>
          <div className="space-y-2">
            {[ { key: "ent", label: "ENT" }, { key: "oral", label: "Oral Cavity" }, { key: "headNeck", label: "Head & Neck" }, { key: "lungsChest", label: "Lungs & Chest" }, { key: "cardiovascular", label: "CardioVascular" }, { key: "skinVaricose", label: "Skin & Varicose" } ].map((sys) => (
              <div key={sys.key} className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">{sys.label}</label>
                <input type="text" className="w-full border p-1.5 text-sm rounded bg-white font-bold outline-none focus:border-teal-400" value={(exam as any)[sys.key]} onChange={e => setExam({...exam, [sys.key]: e.target.value})} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}