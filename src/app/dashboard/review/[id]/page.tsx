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
  const [remarks, setRemarks] = useState("MEDICALLY FIT FOR DUTY");
  const [advice, setAdvice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFitnessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFitness(val);
    if (val === "FIT") setRemarks("MEDICALLY FIT FOR DUTY");
    else if (val === "UNFIT") setRemarks("UNFIT FOR DESIGNATED DUTIES");
    else if (val === "FOLLOW-UP") setRemarks("REQUIRES MEDICAL FOLLOW-UP");
    else if (val === "FIT WITH CONDITION") setRemarks("FIT WITH SPECIFIC CONDITIONS");
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Clinical Data...</div>;
  const emp = data?.employee;

  const getLab = (testName: string) => {
    if (!emp?.labResults) return "-";
    const test = emp.labResults.find((l: any) => l.testName.toLowerCase().includes(testName.toLowerCase()));
    return test ? `${test.result || ""} ${test.unit || ""}`.trim() : "-";
  };

  const handleFinalize = async () => {
    setSaving(true);
    const finalRemarks = advice ? `${remarks} | Advice: ${advice}` : remarks;
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, fitness, remarks: finalRemarks })
    });
    
    if (res.ok) {
      alert("Report Finalized successfully!");
      router.push("/dashboard/review");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 
        ADVANCED PRINT CSS: 
        Forces 21x27.7cm. Uses table headers to repeat demographics on page 2.
      */}
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
            padding-left: 1.5cm;
            padding-right: 1.5cm;
            background: white;
            margin: 0;
          }
          /* This forces the thead (demographics) to repeat on every printed page */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
        }
      `}} />

      {/* 🛑 ACTION BAR (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 print:hidden flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#002642] border-b pb-2">Medical Sign-Off Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Final Conclusion</label>
            <select className="w-full border p-2.5 rounded-lg bg-gray-50 font-bold text-[#002642] outline-none focus:ring-2 focus:ring-teal-500" value={fitness} onChange={handleFitnessChange}>
              <option>FIT</option>
              <option>FIT WITH CONDITION</option>
              <option>FOLLOW-UP</option>
              <option>UNFIT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Primary Remark</label>
            <input type="text" className="w-full border p-2.5 rounded-lg font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500" value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor's Advice (Optional)</label>
            <input type="text" className="w-full border p-2.5 rounded-lg font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Drink warm water, Use glasses..." value={advice} onChange={e => setAdvice(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2 border-t pt-4">
          <button onClick={() => window.print()} className="bg-gray-100 text-[#002642] px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2">
            🖨️ Print Preview
          </button>
          <button onClick={handleFinalize} disabled={saving} className="bg-[#008C8C] text-white px-8 py-2.5 rounded-xl font-bold shadow hover:bg-teal-600 transition disabled:opacity-50">
            {saving ? "Processing..." : "Finalize & Save"}
          </button>
        </div>
      </div>

      {/* --- REPEATING TABLE-BASED PRINTABLE REPORT --- */}
      <table id="printable-report" className="w-full bg-white text-[11px] text-gray-800 print:text-[10px] print:leading-snug shadow-xl print:shadow-none border-none">
        
        {/* 1. TABLE HEADER (Repeats on Page 2 automatically) */}
        <thead>
          <tr>
            <td>
              {/* 4.5cm Invisible Spacer for physical letterhead (Repeats on every page) */}
              <div className="h-0 print:h-[4.5cm] w-full"></div>

              <div className="text-center print:mb-2 mb-6">
                <h2 className="text-lg font-black uppercase tracking-widest text-[#002642]">Medical Examination Report</h2>
                <div className="w-12 h-0.5 bg-[#008C8C] mx-auto mt-1"></div>
              </div>

              {/* Minimal Demographics Section */}
              <div className="bg-gray-50/50 rounded-lg print:p-2.5 p-4 print:mb-3 mb-6 border border-gray-100">
                <div className="grid grid-cols-3 gap-y-2 gap-x-4">
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Patient Name</span><span className="font-bold text-xs uppercase text-black">{emp?.name}</span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Client Organization</span><span className="font-bold uppercase text-black">{emp?.camp?.client?.name}</span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Exam Date</span><span className="font-bold text-black">{new Date().toLocaleDateString()}</span></div>
                  
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">UHID / Serial No</span><span className="font-bold font-mono text-[#008C8C]">{emp?.uhid} <span className="text-gray-400 font-sans">| SR: {emp?.serialNo}</span></span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Emp Code</span><span className="font-bold font-mono">{emp?.empCode || "-"}</span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Age / Gender</span><span className="font-bold">{emp?.age || "-"} Yrs / {emp?.sex || "-"}</span></div>
                  
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Department & Role</span><span className="font-bold">{emp?.department || "-"} | {emp?.designation || "-"}</span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Contact</span><span className="font-bold">{emp?.contactNo || "-"}</span></div>
                  <div><span className="text-gray-500 block text-[8px] uppercase tracking-wider">Email</span><span className="font-bold truncate">{emp?.email || "-"}</span></div>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        {/* 2. TABLE BODY (The Main Content) */}
        <tbody>
          <tr>
            <td>
              {/* Vitals & History (Compressed for print) */}
              <div className="print:mb-3 mb-6">
                <h3 className="text-[#008C8C] text-[9px] font-bold uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-0.5">Vitals & Medical History</h3>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">Height</span><span className="font-bold">{emp?.vitals?.height || "-"}</span></div>
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">Weight</span><span className="font-bold">{emp?.vitals?.weight || "-"}</span></div>
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">BMI</span><span className="font-bold">{emp?.vitals?.bmi || "-"}</span></div>
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">Pulse</span><span className="font-bold">{emp?.vitals?.heartRate || "-"}</span></div>
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">SpO2 %</span><span className="font-bold">{emp?.vitals?.spO2 || "-"}</span></div>
                  <div className="bg-gray-50 p-1.5 rounded text-center"><span className="block text-[8px] text-gray-500 uppercase">BP</span><span className="font-bold">{emp?.vitals?.bloodPress || "-"}</span></div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-200"><span className="text-gray-500">Past History</span><span className="font-bold">{emp?.examination?.pastHistory || "Nil"}</span></div>
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-200"><span className="text-gray-500">Co-Morbidities</span><span className="font-bold">{emp?.examination?.comorbidities || "Nil"}</span></div>
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-200"><span className="text-gray-500">Vision (R / L)</span><span className="font-bold">{emp?.examination?.eyeRight || "6/6"} / {emp?.examination?.eyeLeft || "6/6"}</span></div>
                  <div className="flex justify-between py-1 border-b border-dashed border-gray-200"><span className="text-gray-500">Color Blindness</span><span className="font-bold">{emp?.examination?.colorBlindness || "Normal"}</span></div>
                </div>
              </div>

              {/* 2-Column Split: Clinical & Diagnostics */}
              <div className="grid grid-cols-2 gap-6 print:mb-4 mb-8">
                <div>
                  <h3 className="text-[#008C8C] text-[9px] font-bold uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-0.5">Systemic Examination</h3>
                  <div className="space-y-0.5">
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Eyes</span><span className="font-bold">{emp?.examination?.eyeRight ? "Normal" : "-"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">ENT</span><span className="font-bold">{emp?.examination?.ent || "Normal"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Oral Cavity</span><span className="font-bold">{emp?.examination?.oral || "Normal"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Head & Neck</span><span className="font-bold">{emp?.examination?.headNeck || "Normal"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Lungs & Chest</span><span className="font-bold">{emp?.examination?.lungsChest || "Clear"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">CardioVascular System</span><span className="font-bold">{emp?.examination?.cardiovascular || "Normal S1 S2"}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Skin & Varicose Vein</span><span className="font-bold">{emp?.examination?.skinVaricose || "Normal"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[#008C8C] text-[9px] font-bold uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-0.5">Diagnostic Investigations</h3>
                  <div className="space-y-0.5">
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Blood Group</span><span className="font-bold text-[#002642]">{getLab("Blood Group")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Hb</span><span className="font-bold">{getLab("Hb")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">WBC</span><span className="font-bold">{getLab("WBC")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Platelets</span><span className="font-bold">{getLab("Platelets")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">ESR</span><span className="font-bold">{getLab("ESR")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">SGPT</span><span className="font-bold">{getLab("SGPT")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">S. Creatinine</span><span className="font-bold">{getLab("Creatinine")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">RBS</span><span className="font-bold">{getLab("RBS")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Widal Profile</span><span className="font-bold">{getLab("Widal")}</span></div>
                    <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Urine R/M</span><span className="font-bold">{getLab("Urine")}</span></div>
                  </div>
                </div>
              </div>

              {/* Dynamic Conclusion Block */}
              <div className={`p-4 rounded-lg border-l-4 print:mb-2 mb-6 ${
                fitness === "FIT" ? "bg-green-50 border-green-500" :
                fitness === "UNFIT" ? "bg-red-50 border-red-500" : "bg-yellow-50 border-yellow-500"
              }`}>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider block">Final Conclusion</span>
                    <span className={`text-sm font-black uppercase tracking-wide ${
                      fitness === "FIT" ? "text-green-700" : fitness === "UNFIT" ? "text-red-700" : "text-yellow-700"
                    }`}>{fitness}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase tracking-wider block">Clinical Remarks</span>
                      <span className="font-bold text-gray-800 uppercase">{remarks}</span>
                    </div>
                    {advice && (
                      <div>
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">Medical Advice</span>
                        <span className="font-bold text-[#002642] italic">{advice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>

        {/* 3. TABLE FOOTER (Locks Signatures to the bottom of the content) */}
        <tfoot>
          <tr>
            <td>
              <div className="mt-8 pt-4 flex justify-between items-end print:pb-[2cm]">
                <div className="text-center">
                  <div className="border-b border-gray-400 w-32 mb-1.5"></div>
                  <p className="font-bold text-gray-600 text-[9px] uppercase tracking-wider">Candidate Signature</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 w-48 mb-1.5"></div>
                  <p className="font-black text-[#002642] uppercase text-[10px]">Dr. {emp?.camp?.leadDoctor || "Ankitkumar Patel"}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-wider">Authorized Medical Examiner</p>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>

      </table>
    </div>
  );
}