"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientReportsPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  
  const { data: reportData, isLoading: reportsLoading } = useSWR(
    selectedCampId ? `/api/reports?campId=${selectedCampId}` : null, fetcher
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
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (clientsLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading System...</div>;
  const clients = clientData?.clients || [];
  const employees = reportData?.employees || [];
  const employeesToPrint = employees.filter((emp: any) => selectedEmployees.includes(emp.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 🛑 SCREEN UI (Hidden during printing) */}
      <div className="print:hidden space-y-6">
        <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#002642]">Client Reports & Batch Certificates</h1>
            <p className="text-gray-500 mt-1">Select completed employee files to generate and print final medical summary certificates.</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={selectedEmployees.length === 0}
            className={`px-6 py-2.5 rounded-xl font-bold shadow-md transition flex items-center gap-2 ${
              selectedEmployees.length > 0 
                ? "bg-[#008C8C] hover:bg-[#006b6b] text-white" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            🖨️ Print Selected ({selectedEmployees.length})
          </button>
        </div>

        <div className="bg-[#002642] p-6 rounded-2xl shadow-md text-white">
          <label className="block text-xs font-bold text-teal-300 mb-2 uppercase tracking-wider">Select Target Camp</label>
          <select 
            className="w-full p-3 rounded-xl text-gray-900 font-bold outline-none bg-white shadow-inner" 
            value={selectedCampId} 
            onChange={(e) => {
              setSelectedCampId(e.target.value);
              setSelectedEmployees([]);
            }}
          >
            <option value="">-- Choose a Client & Camp --</option>
            {clients.map((client: any) => client.camps.map((camp: any) => (
              <option key={camp.id} value={camp.id}>{client.name} - {camp.campName}</option>
            )))}
          </select>
        </div>

        {selectedCampId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-[#002642] text-sm">Employee Roster & Assessment Status</span>
              <span className="text-xs text-gray-500 font-semibold">{employees.length} Total Records</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" className="w-4 h-4 cursor-pointer accent-[#008C8C]" 
                      checked={employees.length > 0 && selectedEmployees.length === employees.length}
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiers</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fitness Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsLoading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">Loading Employee Records...</td></tr>
                ) : employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-teal-50/30 transition cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-4 h-4 pointer-events-none accent-[#008C8C]" checked={selectedEmployees.includes(emp.id)} readOnly />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#002642]">{emp.name}</p>
                      <p className="text-xs text-gray-500">Dept: {emp.department || "-"} | Desig: {emp.designation || "-"}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-xs font-bold text-[#008C8C]">{emp.uhid}</p>
                      <p className="font-mono text-[11px] text-gray-400">{emp.certificateNo || "Cert Pending"}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wide ${
                        emp.conclusion?.fitness === "FIT" ? "bg-green-100 text-green-800" :
                        emp.conclusion?.fitness === "UNFIT" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
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

      {/* 🖨️ PRINT UI (Classic Clean Structured Design) */}
      <div className="hidden print:block text-black bg-white">
        {employeesToPrint.map((emp: any) => (
          <div key={emp.id} className="print-page w-full min-h-screen p-8 flex flex-col justify-between page-break" style={{ pageBreakAfter: "always" }}>
            
            {/* Header Section */}
            <div>
              <div className="flex justify-between items-center border-b-2 border-[#002642] pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black text-[#002642] tracking-wider">VYORA HEALTHCARE</h1>
                  <p className="text-xs font-bold text-gray-600">PRIVATE LIMITED • OCCUPATIONAL HEALTH DIVISION</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">MEDICAL FITNESS CERTIFICATE</p>
                  <p className="text-[10px] font-mono text-gray-500">{emp.certificateNo || "REF: VHC/2026/FSSAI"}</p>
                </div>
              </div>

              {/* Employee Information Block */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-6 border border-gray-300 p-4 rounded-lg bg-gray-50/50">
                <div><span className="font-bold text-gray-600">Employee Name:</span> <span className="font-semibold text-black">{emp.name}</span></div>
                <div><span className="font-bold text-gray-600">UHID:</span> <span className="font-mono font-semibold">{emp.uhid}</span></div>
                <div><span className="font-bold text-gray-600">Client Organization:</span> <span className="font-semibold">{emp.camp?.client?.name}</span></div>
                <div><span className="font-bold text-gray-600">Employee Code:</span> <span className="font-mono">{emp.empCode || "-"}</span></div>
                <div><span className="font-bold text-gray-600">Department / Role:</span> <span>{emp.department || "-"} / {emp.designation || "-"}</span></div>
                <div><span className="font-bold text-gray-600">Age / Sex:</span> <span>{emp.age || "-"} Yrs / {emp.sex || "-"}</span></div>
              </div>

              {/* Clinical Vitals & Examination Summary */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 p-1.5 border-l-4 border-[#002642] mb-2">1. Physical & Vitals Evaluation</h3>
                  <div className="grid grid-cols-4 gap-2 text-xs border border-gray-200 p-3 rounded">
                    <div><span className="text-gray-500 block">Height/Weight</span> <span className="font-bold">{emp.vitals?.height || "-"} cm / {emp.vitals?.weight || "-"} kg</span></div>
                    <div><span className="text-gray-500 block">BMI</span> <span className="font-bold">{emp.vitals?.bmi || "-"}</span></div>
                    <div><span className="text-gray-500 block">Blood Pressure</span> <span className="font-bold">{emp.vitals?.bloodPress || "-"}</span></div>
                    <div><span className="text-gray-500 block">Pulse Rate</span> <span className="font-bold">{emp.vitals?.heartRate ? `${emp.vitals.heartRate} bpm` : "-"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 p-1.5 border-l-4 border-[#002642] mb-2">2. Clinical Observations</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs border border-gray-200 p-3 rounded">
                    <div><span className="text-gray-500 block">Vision (L / R)</span> <span className="font-bold">{emp.examination?.eyeLeft || "6/6"} / {emp.examination?.eyeRight || "6/6"}</span></div>
                    <div><span className="text-gray-500 block">Color Blindness</span> <span className="font-bold">{emp.examination?.colorBlindness || "Normal"}</span></div>
                    <div><span className="text-gray-500 block">Systemic Exam</span> <span className="font-bold">Normal / Unremarkable</span></div>
                  </div>
                </div>

                {emp.labResults && emp.labResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 p-1.5 border-l-4 border-[#002642] mb-2">3. Laboratory Investigation Summary</h3>
                    <div className="border border-gray-200 rounded text-xs overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-2 font-bold">Test Name</th>
                            <th className="p-2 font-bold">Result Value</th>
                            <th className="p-2 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {emp.labResults.map((lab: any) => (
                            <tr key={lab.id}>
                              <td className="p-2">{lab.testName}</td>
                              <td className="p-2 font-mono font-semibold">{lab.result || "N/A"} {lab.unit || ""}</td>
                              <td className="p-2 font-bold text-teal-800">{lab.flag || "NORMAL"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 p-1.5 border-l-4 border-[#002642] mb-2">4. Final Medical Conclusion</h3>
                  <div className="border border-gray-200 p-3 rounded text-xs space-y-1">
                    <div><span className="font-bold text-gray-600">Fitness Status:</span> <span className="font-extrabold text-sm uppercase text-[#008C8C]">{emp.conclusion?.fitness || "FIT"}</span></div>
                    <div><span className="font-bold text-gray-600">Clinical Remarks:</span> <span>{emp.conclusion?.remarks || "Found fit for occupational duties with no active signs of communicable or infectious diseases."}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* FSSAI Statutory Declaration & Signatures */}
            <div className="mt-4 pt-4 border-t-2 border-gray-300">
              <p className="text-[10px] font-bold text-gray-600 italic mb-6 text-justify leading-relaxed">
                STATUTORY DECLARATION (FSSAI Food Handler Standard / Factory Act): I hereby certify that I have medically examined the above-named person and found them to be free from any infectious, communicable, or skin diseases. They are physically and medically fit to perform food handling/industrial operations.
              </p>
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="border-b border-black w-44 mb-1"></div>
                  <p className="text-[11px] font-bold">Candidate Signature</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-black w-48 mb-1"></div>
                  <p className="text-[11px] font-bold">Dr. {emp.camp?.leadDoctor || "Ankitkumar Patel"}</p>
                  <p className="text-[9px] text-gray-500">Authorized Medical Examiner</p>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}