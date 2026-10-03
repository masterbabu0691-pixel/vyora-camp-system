"use client";
import { useState, useEffect } from "react";
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
  const [diagnosticRemarks, setDiagnosticRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const emp = data?.employee;

  // Pre-fill existing data if the doctor is re-editing a completed report
  useEffect(() => {
    if (emp?.fitness) setFitness(emp.fitness);
    if (emp?.remarks) setRemarks(emp.remarks);
    if (emp?.diagnosticRemarks) setDiagnosticRemarks(emp.diagnosticRemarks);
  }, [emp]);

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Report Data...</div>;

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
      // Added diagnosticRemarks to the payload
      body: JSON.stringify({ employeeId, fitness, remarks, diagnosticRemarks })
    });
    if (res.ok) {
      alert("Report Finalized successfully!");
      router.push("/dashboard/review");
    }
    setSaving(false);
  };

  const renderDiagnosticReview = (testName: string, status: string, fileData: string | null) => {
    if (status === "N/A" || !status) return null; 
    
    return (
      <div className="bg-gray-50 border p-3 rounded-lg flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{testName} Status</p>
          {status === "DONE" && <p className="text-sm font-black text-green-600">✓ COMPLETED</p>}
          {status === "ARRIVED" && <p className="text-sm font-black text-blue-600">⏳ IN PROGRESS</p>}
          {status === "PENDING" && <p className="text-sm font-black text-amber-500">PENDING QUEUE</p>}
        </div>
        {status === "DONE" && fileData && (
          <button 
            onClick={() => setPreviewFile(fileData)}
            className="bg-[#008C8C] text-white px-4 py-2 rounded text-xs font-bold shadow hover:bg-teal-600 transition"
          >
            👁️ View {testName}
          </button>
        )}
      </div>
    );
  };

  const getDiagnosticPrintStatus = (status: string) => {
    if (status === "N/A" || !status) return null;
    if (status === "DONE") return "Normal / Clear";
    return "Pending Review";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#002642] p-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold tracking-wider">Diagnostic Report Viewer</h2>
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

      {/* DOCTOR REVIEW MODULE */}
      <div className="bg-white p-6 rounded-xl shadow-md border print:hidden">
        <h2 className="text-xl font-bold text-[#002642] mb-4 border-b pb-2">Diagnostic Scans Review</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {renderDiagnosticReview("X-Ray", emp?.xrayStatus, emp?.xrayFile)}
          {renderDiagnosticReview("ECG", emp?.ecgStatus, emp?.ecgFile)}
          {renderDiagnosticReview("PFT", emp?.pftStatus, emp?.pftFile)}
          {renderDiagnosticReview("Audiometry", emp?.audioStatus, emp?.audioFile)}
          
          {(!emp?.xrayStatus || emp?.xrayStatus === "N/A") && 
           (!emp?.ecgStatus || emp?.ecgStatus === "N/A") && 
           (!emp?.pftStatus || emp?.pftStatus === "N/A") && 
           (!emp?.audioStatus || emp?.audioStatus === "N/A") && (
            <div className="col-span-2 text-gray-400 text-sm italic py-2">
              No specialized diagnostic tests were assigned to this patient's camp.
            </div>
          )}
        </div>
        
        {/* NEW: Diagnostic Remarks Field */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-bold text-[#002642] mb-2">Doctor's Notes on Diagnostics (Optional)</label>
          <textarea 
            className="w-full border-2 border-gray-200 p-3 rounded-lg font-medium text-gray-700 outline-none focus:border-[#008C8C]"
            rows={2}
            placeholder="e.g., Mild cardiomegaly noted on X-Ray. ECG shows Normal Sinus Rhythm."
            value={diagnosticRemarks}
            onChange={(e) => setDiagnosticRemarks(e.target.value)}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: 21cm 27.7cm; margin: 0; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report {
            position: absolute; left: 0; top: 0; width: 21cm; height: 27.7cm;
            padding-top: 4.5cm; padding-left: 1.5cm; padding-right: 1.5cm;
            background: white; box-sizing: border-box; margin: 0;
          }
        }
      `}} />

      <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="flex gap-4 items-center flex-1">
          <label className="font-bold text-[#002642]">Conclusion:</label>
          <select className="border-2 border-gray-200 p-2 rounded-lg bg-gray-50 font-bold outline-none focus:border-[#008C8C]" value={fitness} onChange={e => setFitness(e.target.value)}>
            <option>FIT</option>
            <option>FIT WITH CONDITION</option>
            <option>FOLLOW-UP</option>
            <option>UNFIT</option>
          </select>
          <input type="text" className="border-2 border-gray-200 p-2 rounded-lg w-full max-w-sm font-semibold outline-none focus:border-[#008C8C]" placeholder="Overall Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-black transition">
            🖨️ Print Report
          </button>
          <button onClick={handleFinalize} disabled={saving} className="bg-[#008C8C] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-teal-600 disabled:opacity-50 transition">
            {saving ? "Saving..." : "✓ Finalize"}
          </button>
        </div>
      </div>

      {/* --- A4 PRINTABLE REPORT BELOW --- */}
      <div id="printable-report" className="bg-white p-8 shadow-2xl border print:shadow-none print:border-none print:p-0">
        
        <div className="flex justify-between items-center border-b-2 border-[#002642] pb-4 mb-4 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-[#002642] tracking-tighter">Vyora</h1>
            <p className="text-xs font-bold text-[#008C8C] tracking-widest uppercase">Cares that never stops</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">MEDICAL EXAMINATION REPORT</h2>
          </div>
        </div>

        <div className="hidden print:block text-center border-b-2 border-black pb-2 mb-3">
          <h2 className="text-lg font-bold text-black tracking-wide">MEDICAL EXAMINATION REPORT</h2>
        </div>

        <p className="text-right text-xs font-semibold text-gray-600 mb-2">
          {emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        </p>

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
                
                {emp?.xrayStatus && emp.xrayStatus !== "N/A" && <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">X-Ray Chest</td><td className="py-1 font-bold">{getDiagnosticPrintStatus(emp.xrayStatus)}</td></tr>}
                {emp?.ecgStatus && emp.ecgStatus !== "N/A" && <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">ECG</td><td className="py-1 font-bold">{getDiagnosticPrintStatus(emp.ecgStatus)}</td></tr>}
                {emp?.pftStatus && emp.pftStatus !== "N/A" && <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">PFT</td><td className="py-1 font-bold">{getDiagnosticPrintStatus(emp.pftStatus)}</td></tr>}
                {emp?.audioStatus && emp.audioStatus !== "N/A" && <tr className="border-b"><td className="py-1 text-gray-600 font-semibold">Audiometry</td><td className="py-1 font-bold">{getDiagnosticPrintStatus(emp.audioStatus)}</td></tr>}
                
                {/* NEW: Displays the diagnostic remarks dynamically on the report if provided */}
                {diagnosticRemarks && (
                  <tr className="border-b bg-gray-50">
                    <td className="py-1 text-gray-700 font-bold align-top">Scans Note:</td>
                    <td className="py-1 font-bold text-black italic">{diagnosticRemarks}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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

        <div className="border border-black p-2 mt-4 flex flex-col items-center bg-gray-50">
          <h3 className="text-sm font-black mb-1 uppercase tracking-wider">FINAL CONCLUSION</h3>
          <p className="text-lg font-bold text-black mb-1">{fitness}</p>
          <p className="text-xs font-semibold text-gray-700 uppercase italic">"{remarks}"</p>
        </div>

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