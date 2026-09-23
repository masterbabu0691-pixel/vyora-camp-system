"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientReportsPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  
  // Use the standard employees endpoint to get everyone for the camp
  const { data: reportData, isLoading: reportsLoading } = useSWR(
    selectedCampId ? `/api/employees?campId=${selectedCampId}` : null, fetcher
  );

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedEmployees.length === reportData?.employees?.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(reportData?.employees?.map((e: any) => e.id) || []);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
  };

  const handlePrint = () => window.print();

  // Helper function to extract specific tests from the dynamic Lab Results array
  const getLab = (emp: any, testName: string) => {
    if (!emp.labResults) return "-";
    const test = emp.labResults.find((l: any) => l.testName.toLowerCase().includes(testName.toLowerCase()));
    return test ? `${test.result || ""} ${test.unit || ""}`.trim() : "-";
  };

  if (clientsLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading System...</div>;
  const clients = clientData?.clients || [];
  const employees = reportData?.employees || [];
  const employeesToPrint = employees.filter((emp: any) => selectedEmployees.includes(emp.id));

  // Automated Dashboard Statistics
  const total = employees.length;
  const completed = employees.filter((e: any) => e.conclusion?.fitness).length;
  const pending = total - completed;
  const fitCount = employees.filter((e: any) => e.conclusion?.fitness === 'FIT').length;
  const unfitCount = employees.filter((e: any) => e.conclusion?.fitness === 'UNFIT').length;
  const followUpCount = employees.filter((e: any) => e.conclusion?.fitness === 'FOLLOW-UP' || e.conclusion?.fitness === 'FIT WITH CONDITION').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* FORCE CUSTOM PAPER SIZE FOR PRINTING: 21cm x 27.7cm */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: 21cm 27.7cm; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-hide { display: none !important; }
          /* Forces a page break after each report */
          .print-container { 
            width: 21cm; 
            height: 27.7cm; 
            padding: 4.5cm 1.5cm 2.5cm 1.5cm; /* 4.5cm gap for letterhead */
            box-sizing: border-box; 
            page-break-after: always; 
            position: relative; 
            background: white;
          }
        }
      `}} />

      {/* 🛑 SCREEN UI (Hidden during printing) */}
      <div className="print-hide space-y-6">
        <div className="border-b pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#002642]">Final Medical Reports</h1>
            <p className="text-gray-500 mt-1">Select employees to batch print the mapped 21x27.7cm letterhead summaries.</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={selectedEmployees.length === 0}
            className={`px-6 py-2.5 rounded-xl font-bold shadow-md transition flex items-center gap-2 ${
              selectedEmployees.length > 0 ? "bg-[#008C8C] hover:bg-[#006b6b] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            🖨️ Print Selected ({selectedEmployees.length})
          </button>
        </div>

        <div className="bg-[#002642] p-6 rounded-2xl shadow-md text-white">
          <label className="block text-xs font-bold text-teal-300 mb-2 uppercase tracking-wider">Select Target Camp</label>
          <select className="w-full p-3 rounded-xl text-gray-900 font-bold outline-none" value={selectedCampId} onChange={(e) => { setSelectedCampId(e.target.value); setSelectedEmployees([]); }}>
            <option value="">-- Choose a Client & Camp --</option>
            {clients.map((client: any) => client.camps.map((camp: any) => (
              <option key={camp.id} value={camp.id}>{client.name} - {camp.campName}</option>
            )))}
          </select>
        </div>

        {/* DASHBOARD STATISTICS */}
        {selectedCampId && !reportsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p><p className="text-2xl font-black text-[#002642]">{total}</p></div>
            <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 text-center"><p className="text-xs font-bold text-green-700 uppercase tracking-wider">Fit</p><p className="text-2xl font-black text-green-700">{fitCount}</p></div>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200 text-center"><p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Follow-Up</p><p className="text-2xl font-black text-yellow-700">{followUpCount}</p></div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200 text-center"><p className="text-xs font-bold text-red-700 uppercase tracking-wider">Unfit</p><p className="text-2xl font-black text-red-700">{unfitCount}</p></div>
            <div className="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-300 text-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p><p className="text-2xl font-black text-gray-700">{pending}</p></div>
          </div>
        )}

        {selectedCampId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4 w-12 text-center"><input type="checkbox" className="w-4 h-4 cursor-pointer accent-[#008C8C]" checked={employees.length > 0 && selectedEmployees.length === employees.length} onChange={toggleSelectAll} /></th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiers</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsLoading ? <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">Loading...</td></tr> : employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-teal-50/30 transition cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                    <td className="p-4 text-center"><input type="checkbox" className="w-4 h-4 pointer-events-none accent-[#008C8C]" checked={selectedEmployees.includes(emp.id)} readOnly /></td>
                    <td className="p-4"><p className="font-bold text-[#002642]">{emp.name}</p><p className="text-xs text-gray-500">{emp.designation || "-"}</p></td>
                    <td className="p-4"><p className="font-mono text-xs font-bold text-[#008C8C]">{emp.uhid}</p><p className="font-mono text-[11px] text-gray-400">SR: {emp.serialNo}</p></td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                        emp.conclusion?.fitness === 'FIT' ? 'bg-green-100 text-green-800' :
                        emp.conclusion?.fitness === 'UNFIT' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {emp.conclusion?.fitness || emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🖨️ PRINT UI (Mapped exactly to the reference document) */}
      <div className="hidden print:block text-black bg-white">
        {employeesToPrint.map((emp: any) => {
          
          // Advice formatting logic
          const rawRemarks = emp.conclusion?.remarks || "FIT FOR DUTY";
          let displayRemark = rawRemarks;
          let displayAdvice = "";
          
          if (rawRemarks.includes(" | Advice: ")) {
            const parts = rawRemarks.split(" | Advice: ");
            displayRemark = parts[0];
            displayAdvice = parts[1];
          }

          return (
            <div key={emp.id} className="print-container text-[11px]">
              
              <h2 className="text-center text-lg font-black uppercase underline underline-offset-4 mb-4 tracking-widest text-[#002642]">Medical Examination Report</h2>

              {/* Header Details Grid */}
              <div className="border-2 border-black p-2 mb-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-semibold">
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Exam Date:</span> <span>{new Date().toLocaleDateString()}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Serial No:</span> <span>{emp.serialNo}</span></div>
                  
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Client Name:</span> <span className="uppercase">{emp.camp?.client?.name}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Client Code:</span> <span className="uppercase">{emp.camp?.client?.clientCode || "-"}</span></div>
                  
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Name:</span> <span className="uppercase">{emp.name}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Age / Sex:</span> <span>{emp.age || "-"} Year / {emp.sex || "-"}</span></div>
                  
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Emp Code:</span> <span>{emp.empCode || "-"}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Status:</span> <span>{emp.conclusion?.fitness || "FIT"}</span></div>
                  
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Department:</span> <span>{emp.department || "-"}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Designation:</span> <span>{emp.designation || "-"}</span></div>
                  
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Email ID:</span> <span>{emp.email || "-"}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-gray-700">Contact No:</span> <span>{emp.contactNo || "-"}</span></div>
                </div>
              </div>

              {/* Vitals, History & Eyes */}
              <div className="border-2 border-black mb-3">
                <div className="grid grid-cols-6 divide-x divide-black border-b border-black text-center font-bold">
                  <div className="p-1">Height: {emp.vitals?.height || "-"}</div>
                  <div className="p-1">Weight: {emp.vitals?.weight || "-"}</div>
                  <div className="p-1">BMI: {emp.vitals?.bmi || "-"}</div>
                  <div className="p-1">Heart Rate: {emp.vitals?.heartRate || "-"}</div>
                  <div className="p-1">SpO2 %: {emp.vitals?.spO2 || "-"}</div>
                  <div className="p-1">BP: {emp.vitals?.bloodPress || "-"}</div>
                </div>
                
                <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
                  <div className="p-1.5 flex"><span className="w-28 font-bold text-gray-700">Past History:</span> <span>{emp.examination?.pastHistory || "Nil"}</span></div>
                  <div className="p-1.5 flex"><span className="w-28 font-bold text-gray-700">Co-Morbidities:</span> <span>{emp.examination?.comorbidities || "Nil"}</span></div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-black">
                  <div className="p-1.5 flex bg-gray-100 font-bold justify-center items-center">Systematic Examination:</div>
                  <div className="p-1.5 flex flex-col justify-center">
                    <div className="flex"><span className="w-16 font-bold">Right:</span> <span>{emp.examination?.eyeRight || "6/6"}</span></div>
                    <div className="flex"><span className="w-16 font-bold">Left:</span> <span>{emp.examination?.eyeLeft || "6/6"}</span></div>
                  </div>
                  <div className="p-1.5 flex items-center"><span className="w-28 font-bold">Color Blindness:</span> <span>{emp.examination?.colorBlindness || "Normal"}</span></div>
                </div>
              </div>

              {/* 2-Column Split: Physical vs Blood Investigation */}
              <div className="grid grid-cols-2 gap-3 mb-3 h-[8.5cm]">
                {/* Left Column: Physical Exam */}
                <div className="border-2 border-black h-full">
                  <div className="bg-gray-200 border-b-2 border-black p-1 font-bold text-center tracking-wider uppercase">Physical Examination</div>
                  <div className="p-2 space-y-2">
                    <div className="grid grid-cols-2"><span className="font-bold">Eyes:</span> <span>{emp.examination?.eyeRight ? "Normal" : "-"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">ENT:</span> <span>{emp.examination?.ent || "Normal"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Oral:</span> <span>{emp.examination?.oral || "Normal"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Head & Neck:</span> <span>{emp.examination?.headNeck || "Normal"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Lungs & Chest:</span> <span>{emp.examination?.lungsChest || "Clear"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">CardioVascular:</span> <span>{emp.examination?.cardiovascular || "Normal S1 S2"}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Skin & Varicose Vein:</span> <span>{emp.examination?.skinVaricose || "Normal"}</span></div>
                  </div>
                </div>

                {/* Right Column: Blood & Urine Investigation */}
                <div className="border-2 border-black h-full">
                  <div className="bg-gray-200 border-b-2 border-black p-1 font-bold text-center tracking-wider uppercase">Diagnostic Investigation</div>
                  <div className="p-2 space-y-[0.35rem]">
                    <div className="grid grid-cols-2"><span className="font-bold">Hb:</span> <span>{getLab(emp, "Hb")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">WBC:</span> <span>{getLab(emp, "WBC")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Platelets:</span> <span>{getLab(emp, "Platelets")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">ESR:</span> <span>{getLab(emp, "ESR")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">SGPT:</span> <span>{getLab(emp, "SGPT")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">S.Creatinine:</span> <span>{getLab(emp, "Creatinine")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Widal Profile:</span> <span>{getLab(emp, "Widal")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">Blood Group:</span> <span>{getLab(emp, "Blood Group")}</span></div>
                    <div className="grid grid-cols-2"><span className="font-bold">RBS:</span> <span>{getLab(emp, "RBS")}</span></div>
                    <div className="grid grid-cols-2 pt-2 mt-2 border-t border-dashed border-gray-400"><span className="font-bold text-[#002642]">Urine R/M:</span> <span>{getLab(emp, "Urine")}</span></div>
                  </div>
                </div>
              </div>

              {/* Conclusion Block with Advice separation */}
              <div className="border-2 border-black p-2 mb-8 flex flex-col gap-1">
                <div>
                  <span className="font-bold text-gray-700 w-36 inline-block">Conclusion / Remark:</span> 
                  <span className="font-bold text-[#002642] uppercase">{displayRemark}</span>
                </div>
                {displayAdvice && (
                  <div>
                    <span className="font-bold text-gray-700 w-36 inline-block">Doctor's Advice:</span> 
                    <span className="font-bold italic text-gray-800">{displayAdvice}</span>
                  </div>
                )}
              </div>

              {/* Signature Block (Locked to absolute bottom) */}
              <div className="absolute bottom-[2.5cm] left-[1.5cm] right-[1.5cm] flex justify-between items-end">
                <div className="text-center">
                  <div className="border-b border-black w-40 mb-1"></div>
                  <p className="font-bold">Candidate Signature</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-black w-48 mb-1"></div>
                  <p className="font-bold uppercase">Dr. {emp.camp?.leadDoctor || "Ankitkumar Patel"}</p>
                  <p className="text-[9px] text-gray-500">Authorized Medical Examiner</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}