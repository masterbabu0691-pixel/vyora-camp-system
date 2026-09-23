"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const router = useRouter();
  
  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);
  const [fitness, setFitness] = useState("FIT");
  const [remarks, setRemarks] = useState("FIT FOR DUTY");
  const [saving, setSaving] = useState(false);

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Report Data...</div>;
  const emp = data?.employee;

  // Standardized Lab Helper
  const getLab = (testName: string) => {
    if (!emp?.labResults) return "-";
    const test = emp.labResults.find((l: any) => l.testName.toLowerCase().includes(testName.toLowerCase()));
    return test ? `${test.result || ""} ${test.unit || ""}`.trim() : "-";
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* MAGIC PRINT CSS: Isolates the report, forces 21x27.7cm, and respects the 4cm letterhead margin */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: 21cm 27.7cm; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 21cm;
            height: 27.7cm;
            padding-top: 4cm; 
            padding-bottom: 2.5cm;
            padding-left: 1.5cm;
            padding-right: 1.5cm;
            background: white;
            box-sizing: border-box;
            margin: 0;
          }
        }
      `}} />

      {/* ACTION BAR - HIDDEN DURING PRINTING */}
      <div className="bg-[#002642] p-6 rounded-2xl shadow-md border border-gray-800 print:hidden flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="flex gap-4 items-center w-full md:w-auto">
          <label className="font-bold text-teal-300 uppercase tracking-wider text-sm">Conclusion:</label>
          <select className="border border-gray-600 p-2.5 rounded-lg bg-[#001e36] font-bold text-white outline-none" value={fitness} onChange={e => setFitness(e.target.value)}>
            <option>FIT</option>
            <option>FIT WITH CONDITION</option>
            <option>FOLLOW-UP</option>
            <option>UNFIT</option>
          </select>
          <input type="text" className="border border-gray-600 p-2.5 rounded-lg w-full md:w-64 bg-[#001e36] text-white outline-none" placeholder="Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button onClick={() => window.print()} className="bg-gray-200 text-[#002642] px-6 py-2.5 rounded-xl font-bold shadow hover:bg-white transition flex items-center gap-2">
            🖨️ Print
          </button>
          <button onClick={handleFinalize} disabled={saving} className="bg-[#008C8C] text-white px-6 py-2.5 rounded-xl font-bold shadow hover:bg-teal-500 transition disabled:opacity-50">
            {saving ? "Saving..." : "Finalize & Sign-Off"}
          </button>
        </div>
      </div>

      {/* --- LETTERHEAD PRINTABLE REPORT BELOW --- */}
      <div id="printable-report" className="bg-white p-8 shadow-2xl border print:shadow-none print:border-none print:p-0 text-[11px] text-black overflow-hidden relative" style={{ minHeight: '27.7cm' }}>
        
        {/* On-Screen Title (Hidden on print to respect physical letterhead space) */}
        <div className="print:hidden text-center border-b-2 border-black pb-2 mb-6">
          <h2 className="text-xl font-black uppercase tracking-widest text-[#002642]">Medical Examination Report (Preview)</h2>
        </div>

        <h2 className="hidden print:block text-center text-lg font-black uppercase underline underline-offset-4 mb-4 tracking-widest text-[#002642]">Medical Examination Report</h2>

        {/* Header Details Grid */}
        <div className="border-2 border-black p-2 mb-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-semibold">
            <div className="flex"><span className="w-28 font-bold text-gray-700">Exam Date:</span> <span>{new Date().toLocaleDateString()}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Serial No:</span> <span>{emp?.serialNo}</span></div>
            
            <div className="flex"><span className="w-28 font-bold text-gray-700">Client Name:</span> <span className="uppercase">{emp?.camp?.client?.name}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Client Code:</span> <span className="uppercase">{emp?.camp?.client?.clientCode || "-"}</span></div>
            
            <div className="flex"><span className="w-28 font-bold text-gray-700">Name:</span> <span className="uppercase">{emp?.name}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Age / Sex:</span> <span>{emp?.age || "-"} Year / {emp?.sex || "-"}</span></div>
            
            <div className="flex"><span className="w-28 font-bold text-gray-700">Emp Code:</span> <span>{emp?.empCode || "-"}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Status:</span> <span className="uppercase text-[#008C8C]">{fitness}</span></div>
            
            <div className="flex"><span className="w-28 font-bold text-gray-700">Department:</span> <span>{emp?.department || "-"}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Designation:</span> <span>{emp?.designation || "-"}</span></div>
            
            <div className="flex"><span className="w-28 font-bold text-gray-700">Email ID:</span> <span>{emp?.email || "-"}</span></div>
            <div className="flex"><span className="w-28 font-bold text-gray-700">Contact No:</span> <span>{emp?.contactNo || "-"}</span></div>
          </div>
        </div>

        {/* Vitals, History & Eyes */}
        <div className="border-2 border-black mb-3">
          <div className="grid grid-cols-6 divide-x divide-black border-b border-black text-center font-bold">
            <div className="p-1">Height: {emp?.vitals?.height || "-"}</div>
            <div className="p-1">Weight: {emp?.vitals?.weight || "-"}</div>
            <div className="p-1">BMI: {emp?.vitals?.bmi || "-"}</div>
            <div className="p-1">Heart Rate: {emp?.vitals?.heartRate || "-"}</div>
            <div className="p-1">SpO2 %: {emp?.vitals?.spO2 || "-"}</div>
            <div className="p-1">BP: {emp?.vitals?.bloodPress || "-"}</div>
          </div>
          
          <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
            <div className="p-1.5 flex"><span className="w-28 font-bold text-gray-700">Past History:</span> <span>{emp?.examination?.pastHistory || "Nil"}</span></div>
            <div className="p-1.5 flex"><span className="w-28 font-bold text-gray-700">Co-Morbidities:</span> <span>{emp?.examination?.comorbidities || "Nil"}</span></div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-black">
            <div className="p-1.5 flex bg-gray-100 font-bold justify-center items-center">Systematic Examination:</div>
            <div className="p-1.5 flex flex-col justify-center">
              <div className="flex"><span className="w-16 font-bold">Right:</span> <span>{emp?.examination?.eyeRight || "6/6"}</span></div>
              <div className="flex"><span className="w-16 font-bold">Left:</span> <span>{emp?.examination?.eyeLeft || "6/6"}</span></div>
            </div>
            <div className="p-1.5 flex items-center"><span className="w-28 font-bold">Color Blindness:</span> <span>{emp?.examination?.colorBlindness || "Normal"}</span></div>
          </div>
        </div>

        {/* 2-Column Split: Physical vs Blood Investigation */}
        <div className="grid grid-cols-2 gap-3 mb-3 h-[8cm]">
          {/* Left Column: Physical Exam */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-1 font-bold text-center tracking-wider uppercase">Physical Examination</div>
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-2"><span className="font-bold">Eyes:</span> <span>{emp?.examination?.eyeRight ? "Normal" : "-"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">ENT:</span> <span>{emp?.examination?.ent || "Normal"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Oral:</span> <span>{emp?.examination?.oral || "Normal"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Head & Neck:</span> <span>{emp?.examination?.headNeck || "Normal"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Lungs & Chest:</span> <span>{emp?.examination?.lungsChest || "Clear"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">CardioVascular System:</span> <span>{emp?.examination?.cardiovascular || "Normal S1 S2"}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Skin & Varicose Vein:</span> <span>{emp?.examination?.skinVaricose || "Normal"}</span></div>
            </div>
          </div>

          {/* Right Column: Blood & Urine Investigation */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-1 font-bold text-center tracking-wider uppercase">Blood Investigation</div>
            <div className="p-2 space-y-[0.35rem]">
              <div className="grid grid-cols-2"><span className="font-bold">Hb:</span> <span>{getLab("Hb")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">WBC:</span> <span>{getLab("WBC")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Platelets:</span> <span>{getLab("Platelets")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">ESR:</span> <span>{getLab("ESR")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">SGPT:</span> <span>{getLab("SGPT")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">S.Creatinine:</span> <span>{getLab("Creatinine")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Widal Profile:</span> <span>{getLab("Widal")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">Blood Group:</span> <span>{getLab("Blood Group")}</span></div>
              <div className="grid grid-cols-2"><span className="font-bold">RBS:</span> <span>{getLab("RBS")}</span></div>
              <div className="grid grid-cols-2 pt-2 mt-2 border-t border-dashed border-gray-400"><span className="font-bold text-[#002642]">Urine R/M:</span> <span>{getLab("Urine")}</span></div>
            </div>
          </div>
        </div>

        {/* Live Conclusion Block (Updates as you type in the Action Bar) */}
        <div className="border-2 border-black p-2 mb-8 bg-gray-50">
          <span className="font-bold text-gray-700 w-36 inline-block">Conclusion / Remark:</span> 
          <span className="font-bold text-[#002642] uppercase">{remarks}</span>
        </div>

        {/* Signature Block (Locked to absolute bottom during print) */}
        <div className="print:absolute print:bottom-[2cm] print:left-[1.5cm] print:right-[1.5cm] mt-8 flex justify-between items-end">
          <div className="text-center">
            <div className="border-b border-black w-40 mb-1"></div>
            <p className="font-bold">Candidate Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-48 mb-1"></div>
            <p className="font-bold uppercase">Dr. {emp?.camp?.leadDoctor || "Ankitkumar Patel"}</p>
            <p className="text-[9px] text-gray-500">Authorized Medical Examiner / Reg No.</p>
          </div>
        </div>

      </div>
    </div>
  );
}