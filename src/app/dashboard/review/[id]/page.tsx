"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { use } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();
  
  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [fitness, setFitness] = useState("FIT");
  const [remarks, setRemarks] = useState("Clinically Fit for Duty");
  const [saving, setSaving] = useState(false);
  
  // NEW: State for the In-App Report Viewer Modal
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Report Data...</div>;
  const emp = data?.employee;

  const getLab = (testName: string) => {
    if (!emp?.labResults) return "Pending";
    const test = emp.labResults.find((l: any) => 
      l.testName.toLowerCase().includes(testName.toLowerCase())
    );
    if (!test || !test.result) return "Pending";
    return `${test.result} ${test.unit || ""}`.trim();
  };

  const handleFinalize = async () => {
    setSaving(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, fitness, remarks })
    });
    if (res.ok) {
      alert("Report Finalized successfully!");
      router.push("/dashboard/review");
    }
    setSaving(false);
  };

  // Dynamically find which diagnostic tests were assigned to this patient/camp
  const diagnosticConfigs = [
    { key: 'xray', label: '🩻 X-Ray (Chest)' },
    { key: 'ecg', label: '❤️ ECG (Resting)' },
    { key: 'pft', label: '🫁 Spirometry (PFT)' },
    { key: 'audio', label: '🎧 Audiometry' }
  ];
  
  const assignedDiagnostics = diagnosticConfigs.filter(d => 
    emp && emp[`${d.key}Status`] && emp[`${d.key}Status`] !== 'N/A'
  );

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* IN-APP REPORT VIEWER MODAL */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#002642] p-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold tracking-wider">Clinical Report Viewer</h2>
              <button onClick={() => setPreviewFile(null)} className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded font-bold transition">Close ✖</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
              {previewFile.startsWith('data:application/pdf') ? (
                <iframe src={previewFile} className="w-full h-[70vh] rounded border-2 border-gray-300" />
              ) : (
                <img src={previewFile} alt="Medical Report" className="max-w-full max-h-[75vh] object-contain rounded border border-gray-300 shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAGIC PRINT CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 21cm 27.7cm;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 21cm;
            height: 27.7cm;
            padding-top: 4.5cm; 
            padding-left: 1.5cm;
            padding-right: 1.5cm;
            background: white;
            box-sizing: border-box;
            margin: 0;
          }
        }
      `}} />

      {/* DOCTOR'S PRE-REVIEW DIAGNOSTICS PANEL (Hidden on Print) */}
      {assignedDiagnostics.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border mb-6 print:hidden">
          <h3 className="font-bold text-[#002642] border-b pb-2 mb-4">🩺 Doctor's Review: Specialized Diagnostics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {assignedDiagnostics.map(d => (
              <div key={d.key} className="border p-4 rounded-lg bg-gray-50 flex flex-col items-center text-center">
                <span className="font-bold text-gray-700 text-sm mb-2">{d.label}</span>
                {emp[`${d.key}Status`] === 'DONE' ? (
                  <button
                    onClick={() => setPreviewFile(emp[`${d.key}File`])}
                    className="text-white bg-[#008C8C] px-4 py-2 rounded-md font-bold text-xs hover:bg-teal-700 transition w-full shadow-sm"
                  >
                    👁️ View Report
                  </button>
                ) : (
                  <span className="text-amber-600 bg-amber-50 px-3 py-1 border border-amber-200 rounded text-xs font-bold w-full">
                    {emp[`${d.key}Status`]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BAR - HIDDEN DURING PRINTING */}
      <div className="bg-white p-6 rounded-xl shadow-md border mb-8 print:hidden flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4 items-center">
          <label className="font-bold text-[#002642]">Conclusion:</label>
          <select className="border p-2 rounded bg-gray-50 font-bold" value={fitness} onChange={e => setFitness(e.target.value)}>
            <option>FIT</option>
            <option>FIT WITH CONDITION</option>
            <option>FOLLOW-UP</option>
            <option>UNFIT</option>
          </select>
          <input type="text" className="border p-2 rounded w-64 font-semibold" placeholder="Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-2 rounded-md font-bold shadow hover:bg-black transition">
            Print Report
          </button>
          <button onClick={handleFinalize} disabled={saving} className="bg-[#008C8C] text-white px-6 py-2 rounded-md font-bold shadow hover:bg-teal-600 disabled:opacity-50 transition">
            {saving ? "Saving..." : "Finalize & Complete"}
          </button>
        </div>
      </div>

      {/* --- A4 PRINTABLE REPORT BELOW --- */}
      <div id="printable-report" className="bg-white p-8 shadow-2xl border print:shadow-none print:border-none print:p-0">
        
        {/* WEB HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#002642] pb-4 mb-4 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-[#002642] tracking-tighter">Vyora</h1>
            <p className="text-xs font-bold text-[#008C8C] tracking-widest uppercase">Cares that never stops</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">MEDICAL EXAMINATION REPORT</h2>
          </div>
        </div>

        {/* PRINT TITLE */}
        <div className="hidden print:block text-center border-b-2 border-black pb-2 mb-3">
          <h2 className="text-lg font-bold text-black tracking-wide">MEDICAL EXAMINATION REPORT</h2>
        </div>

        <p className="text-right text-xs font-semibold text-gray-600 mb-2">
          {emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        </p>

        {/* Demographics Grid (Compacted) */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] mb-4">
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Client Organization:</span> <span className="font-bold text-black uppercase">{emp?.camp?.client?.name || "-"}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Serial No:</span> <span className="font-bold text-black">{emp?.serialNo}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Name:</span> <span className="font-bold text-black uppercase">{emp?.name}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Emp Code:</span> <span className="font-bold text-black">{emp?.empCode || "-"}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Age / Sex:</span> <span className="font-bold text-black">{emp?.age || "-"} Yrs / {emp?.sex || "-"}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Department:</span> <span className="font-bold text-black">{emp?.department || "-"}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Contact No:</span> <span className="font-bold text-black">{emp?.contactNo || "-"}</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Height / Weight:</span> <span className="font-bold text-black">{emp?.vitals?.height || "-"} cm / {emp?.vitals?.weight || "-"} kg</span></div>
          <div className="grid grid-cols-2 border-b border-dashed py-0.5 col-span-2"><span className="font-semibold text-gray-600">BMI:</span> <span className="font-bold text-black">{emp?.vitals?.bmi || "-"}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* Medical History & Examination */}
          <div>
            <h3 className="bg-gray-200 text-black px-2 py-1 font-bold text-[11px] mb-2 text-center border border-black">MEDICAL HISTORY & EXAMINATION</h3>
            <table className="w-full text-[11px]">
              <tbody>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold w-1/2">Past History</td><td className="py-1 font-bold">{emp?.examination?.pastHistory || "Nil"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Co-Morbidities</td><td className="py-1 font-bold">{emp?.examination?.comorbidities || "Nil"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Heart Rate</td><td className="py-1 font-bold">{emp?.vitals?.heartRate || "-"} bpm</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Blood Pressure</td><td className="py-1 font-bold">{emp?.vitals?.bloodPress || "-"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">SpO2</td><td className="py-1 font-bold">{emp?.vitals?.spO2 || "-"} %</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Eyes (R / L)</td><td className="py-1 font-bold">{emp?.examination?.eyeRight || "6/6"} / {emp?.examination?.eyeLeft || "6/6"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Color Blindness</td><td className="py-1 font-bold">{emp?.examination?.colorBlindness || "Normal"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">ENT / Oral</td><td className="py-1 font-bold">{emp?.examination?.ent || "Normal"} / {emp?.examination?.oral || "Normal"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Lungs & Chest</td><td className="py-1 font-bold">{emp?.examination?.lungsChest || "Clear"}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">CardioVascular</td><td className="py-1 font-bold">{emp?.examination?.cardiovascular || "Normal S1 S2"}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Blood Investigations */}
          <div>
            <h3 className="bg-gray-200 text-black px-2 py-1 font-bold text-[11px] mb-2 text-center border border-black">LABORATORY INVESTIGATIONS</h3>
            <table className="w-full text-[11px]">
              <tbody>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold w-1/2">Blood Group</td><td className="py-1 font-bold">{getLab('Blood Group')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Hb</td><td className="py-1 font-bold">{getLab('Hb')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">WBC</td><td className="py-1 font-bold">{getLab('WBC')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Platelets</td><td className="py-1 font-bold">{getLab('Platelets')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">ESR</td><td className="py-1 font-bold">{getLab('ESR')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">SGPT</td><td className="py-1 font-bold">{getLab('SGPT')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">S. Creatinine</td><td className="py-1 font-bold">{getLab('Creatinine')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">RBS</td><td className="py-1 font-bold">{getLab('RBS')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Widal Profile</td><td className="py-1 font-bold">{getLab('Widal')}</td></tr>
                <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Urine R/M</td><td className="py-1 font-bold">{getLab('Urine')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* DYNAMIC: SPECIALIZED DIAGNOSTICS FOR THE PRINTED PAGE */}
        {assignedDiagnostics.length > 0 && (
          <div className="mb-4">
            <h3 className="bg-gray-200 text-black px-2 py-1 font-bold text-[11px] mb-2 text-center border border-black">SPECIALIZED DIAGNOSTIC FINDINGS</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
              {assignedDiagnostics.map(d => {
                const isDone = emp[`${d.key}Status`] === 'DONE';
                return (
                  <div key={d.key} className="flex justify-between border-b border-dashed py-0.5">
                    <span className="font-semibold text-gray-600">{d.label.replace(/[^a-zA-Z- ]/g, '')}:</span>
                    <span className={`font-bold ${isDone ? 'text-black' : 'text-gray-400'}`}>
                      {isDone ? 'Completed & Evaluated' : emp[`${d.key}Status`]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conclusion Section */}
        <div className="border border-black p-2 mt-4 flex flex-col items-center bg-gray-50">
          <h3 className="text-sm font-black mb-1 uppercase tracking-wider">FINAL CONCLUSION</h3>
          <p className="text-lg font-bold text-black mb-1">{fitness}</p>
          <p className="text-xs font-semibold text-gray-700 uppercase italic">"{remarks}"</p>
        </div>

        {/* Footer Signature */}
        <div className="mt-16 flex justify-between items-end">
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider">Candidate Signature</p>
            <p className="text-[9px] text-transparent select-none">&nbsp;</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider">Authorized Doctor Signature</p>
            <p className="text-[9px] text-gray-500 font-semibold"> (Vyora Healthcare Pvt Ltd)</p>
          </div>
        </div>

      </div>
    </div>
  );
}