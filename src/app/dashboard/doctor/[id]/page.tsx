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

  // Vitals State
  const [vitals, setVitals] = useState({
    height: "", weight: "", bmi: "", heartRate: "", spO2: "", bloodPress: ""
  });

  // Examination State (Pre-filled with "Normal" to save doctors time)
  const [exam, setExam] = useState({
    pastHistory: "Nil", comorbidities: "Nil",
    eyeRight: "6/6", eyeLeft: "6/6", colorBlindness: "Normal",
    ent: "Normal", oral: "Normal", headNeck: "Normal",
    lungsChest: "Clear", cardiovascular: "Normal S1 S2", skinVaricose: "Normal"
  });

  // AUTO-CALCULATE BMI
  useEffect(() => {
    if (vitals.height && vitals.weight) {
      const hMeters = parseFloat(vitals.height) / 100;
      const wKg = parseFloat(vitals.weight);
      if (hMeters > 0 && wKg > 0) {
        const bmiVal = (wKg / (hMeters * hMeters)).toFixed(1);
        setVitals(prev => ({ ...prev, bmi: bmiVal }));
      }
    }
  }, [vitals.height, vitals.weight]);

  const handleSave = async () => {
    setSaving(true);
    
    // Convert numerical vitals safely
    const payload = {
      employeeId,
      vitals: {
        height: parseFloat(vitals.height) || null,
        weight: parseFloat(vitals.weight) || null,
        bmi: parseFloat(vitals.bmi) || null,
        heartRate: parseInt(vitals.heartRate) || null,
        spO2: parseFloat(vitals.spO2) || null,
        bloodPress: vitals.bloodPress || null,
      },
      examination: exam
    };

    const res = await fetch("/api/doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Clinical Examination saved successfully!");
      router.push("/dashboard/doctor");
    } else {
      alert("Failed to save clinical records.");
    }
    setSaving(false);
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Patient File...</div>;
  const emp = data?.employee;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="bg-[#002642] p-6 rounded-2xl shadow-md text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Doctor Examination Panel</h1>
          <p className="text-teal-300 text-sm mt-1 font-semibold uppercase tracking-widest">Patient: {emp?.name}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-mono text-teal-300 font-bold">{emp?.uhid}</p>
          <p className="text-xs text-gray-400 font-mono">Age: {emp?.age || "-"} | Sex: {emp?.sex || "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Vitals & History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-[#008C8C] uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Vitals & Measurements</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Height (cm)</label>
                <input type="number" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Weight (kg)</label>
                <input type="number" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} />
              </div>
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Auto-Calculated BMI</span>
                <span className="text-lg font-black text-[#002642]">{vitals.bmi || "-"}</span>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Pulse (bpm)</label>
                <input type="number" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">SpO2 (%)</label>
                <input type="number" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={vitals.spO2} onChange={e => setVitals({...vitals, spO2: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Blood Pressure (mmHg)</label>
                <input type="text" placeholder="e.g. 120/80" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={vitals.bloodPress} onChange={e => setVitals({...vitals, bloodPress: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-[#008C8C] uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Medical History</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Past Medical History</label>
                <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={exam.pastHistory} onChange={e => setExam({...exam, pastHistory: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Co-Morbidities</label>
                <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={exam.comorbidities} onChange={e => setExam({...exam, comorbidities: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Systemic Examination */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-[#008C8C] uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Systemic & Physical Exam</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Right Eye</label>
                <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={exam.eyeRight} onChange={e => setExam({...exam, eyeRight: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Left Eye</label>
                <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={exam.eyeLeft} onChange={e => setExam({...exam, eyeLeft: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Color Blindness</label>
              <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C]" value={exam.colorBlindness} onChange={e => setExam({...exam, colorBlindness: e.target.value})} />
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2 grid grid-cols-1 gap-4">
              {[
                { key: "ent", label: "ENT (Ear, Nose, Throat)" },
                { key: "oral", label: "Oral Cavity" },
                { key: "headNeck", label: "Head & Neck" },
                { key: "lungsChest", label: "Lungs & Chest" },
                { key: "cardiovascular", label: "CardioVascular System" },
                { key: "skinVaricose", label: "Skin & Varicose Veins" }
              ].map((sys) => (
                <div key={sys.key} className="flex items-center gap-4">
                  <label className="w-1/3 text-xs font-bold text-gray-500 uppercase">{sys.label}</label>
                  <input 
                    type="text" 
                    className="flex-1 border-2 border-gray-100 p-2 rounded-lg font-bold outline-none focus:border-[#008C8C]" 
                    value={(exam as any)[sys.key]} 
                    onChange={e => setExam({...exam, [sys.key]: e.target.value})} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-end gap-4 sticky bottom-4">
        <button onClick={() => router.push('/dashboard/doctor')} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="bg-[#008C8C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-teal-600 transition disabled:opacity-50">
          {saving ? "Saving Data..." : "Complete Doctor Check"}
        </button>
      </div>

    </div>
  );
}