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

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Report Data...</div>;
  const emp = data?.employee;

  const getLab = (testName: string) => {
    if (!emp?.labResults) return "Pending";
    // Flexible search: matches exact or partial test names (e.g., Hb, WBC, Blood Group)
    const result = emp.labResults.find((l: any) => 
      l.testName.toLowerCase().includes(testName.toLowerCase())
    );
    return result ? `${result.result || ""} ${result.unit || ""}`.trim() : "Pending";
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

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* 
        MAGIC PRINT CSS: 
        Isolates the report from the sidebar, forces exact 21x27.7cm dimensions, 
        and leaves a 4.5cm blank space at the top for your physical letterhead. 
      */}
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
            padding-top: 4.5cm; /* Blank space for physical letterhead header */
            padding-left: 1.5cm;
            padding-right: 1.5cm;
            background: white;
            box-sizing: border-box;
            margin: 0;
          }
        }
      `}} />

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
        
        {/* WEB HEADER (Shows on computer, hides on print so letterhead space remains empty) */}
        <div className="flex justify-between items-center border-b-2 border-[#002642] pb-4 mb-4 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-[#002642] tracking-tighter">Vyora</h1>
            <p className="text-xs font-bold text-[#008C8C] tracking-widest uppercase">Cares that never stops</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">MEDICAL EXAMINATION REPORT</h2>
          </div>
        </div>

        {/* PRINT TITLE (Only shows on physical paper, right beneath your letterhead) */}
        <div className="hidden print:block text-center border-b-2 border-black pb-2 mb-3">
          <h2 className="text-lg font-bold text-black tracking-wide">MEDICAL EXAMINATION REPORT</h2>
        </div>

        <p className="text-right text-xs font-semibold text-gray-600 mb-2">
          Exam Date: {emp?.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
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

        {/* Conclusion Section */}
        <div className="border border-black p-2 mt-4 flex flex-col items-center bg-gray-50">
          <h3 className="text-sm font-black mb-1 uppercase tracking-wider">FINAL CONCLUSION</h3>
          <p className="text-lg font-bold text-black mb-1">{fitness}</p>
          <p className="text-xs font-semibold text-gray-700 uppercase italic">"{remarks}"</p>
        </div>

        {/* Footer Signature */}
        <div className="mt-12 flex justify-between items-end">
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider">Candidate Signature</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider">Authorized Doctor Signature</p>
            <p className="text-[9px] text-gray-500 font-semibold">Dr. Ankitkumar Patel (Vyora Healthcare)</p>
          </div>
        </div>

      </div>
    </div>
  );
}