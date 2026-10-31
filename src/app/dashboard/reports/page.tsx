"use client";
import { useState } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientReportsPage() {
  const { data: clientData, isLoading: clientsLoading, mutate: mutateClients } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [movingEmpId, setMovingEmpId] = useState<string | null>(null);
  const [targetCampId, setTargetCampId] = useState("");
  
  // NEW: Track which type of report we are printing
  const [printMode, setPrintMode] = useState<'MEDICAL' | 'VISION'>('MEDICAL');
  
  const { data: settingsData } = useSWR('/api/settings', fetcher);
  
  const getMargin = (key: string, fallback: string) => 
    settingsData?.settings?.find((s: any) => s.settingKey === key)?.settingVal || fallback;

  const marginTop = getMargin('MARGIN_TOP', '4.5cm');
  const marginBottom = getMargin('MARGIN_BOTTOM', '2cm');
  const marginLeft = getMargin('MARGIN_LEFT', '1.5cm');
  const marginRight = getMargin('MARGIN_RIGHT', '1.5cm');

  const { data: reportData, isLoading: reportsLoading, mutate: refreshEmployees } = useSWR(
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

  // --- DUAL PRINT HANDLERS ---
  const handlePrintMedical = () => {
    setPrintMode('MEDICAL');
    setTimeout(() => window.print(), 150); // Small delay to let React update the DOM
  };

  const handlePrintVision = () => {
    setPrintMode('VISION');
    setTimeout(() => window.print(), 150);
  };

  const handleMoveCamp = async (empId: string) => {
    if (!targetCampId) {
      alert("Please select a target destination camp first.");
      return;
    }

    try {
      const res = await fetch('/api/employees/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, newCampId: targetCampId })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert("Employee successfully moved to the new camp with all medical records intact!");
        setMovingEmpId(null);
        setTargetCampId("");
        refreshEmployees();
      } else {
        alert("Failed to move: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error while reassigning camp.");
    }
  };

  const getDiagnosticExcelStatus = (status: string) => {
    if (!status || status === "N/A") return "N/A";
    if (status === "DONE") return "Normal / Clear";
    return status;
  };

  const handleExportExcel = () => {
    if (!reportData?.employees || reportData.employees.length === 0) {
      alert("No employee data available to export.");
      return;
    }

    const exportRows = reportData.employees.map((emp: any, index: number) => ({
      "Sr No": emp.serialNo || index + 1,
      "UHID": emp.uhid,
      "Employee Name": emp.name,
      "Emp Code": emp.empCode || "-",
      "Department": emp.department || "-",
      "Designation": emp.designation || "-",
      "Age": emp.age || "-",
      "Gender": emp.sex || "-",
      "Contact": emp.contactNo || "-",
      "Height (cm)": emp.vitals?.height || "-",
      "Weight (kg)": emp.vitals?.weight || "-",
      "BMI": emp.vitals?.bmi || "-",
      "BP": emp.vitals?.bloodPress || "-",
      "X-Ray": getDiagnosticExcelStatus(emp.xrayStatus),
      "ECG": getDiagnosticExcelStatus(emp.ecgStatus),
      "PFT": getDiagnosticExcelStatus(emp.pftStatus),
      "Audiometry": getDiagnosticExcelStatus(emp.audioStatus),
      "Scan Notes": emp.diagnosticRemarks || "-",
      "Fitness Status": emp.conclusion?.fitness || emp.status,
      "Clinical Remarks": emp.conclusion?.remarks || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Camp_Report");
    XLSX.writeFile(workbook, `Vyora_Camp_Report_${selectedCampId}.xlsx`);
  };

  const getLab = (emp: any, testName: string) => {
    if (!emp.labResults) return "Pending";
    const test = emp.labResults.find((l: any) => 
      l.testName.toLowerCase().includes(testName.toLowerCase())
    );
    if (!test || !test.result) return "Pending";
    return test.unit ? `${test.result} ${test.unit}` : test.result;
  };

  const getDiagnosticPrintStatus = (status: string) => {
    if (status === "N/A" || !status) return null;
    if (status === "DONE") return "Normal / Clear";
    return "Pending Review";
  };

  if (clientsLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading System...</div>;
  const clients = clientData?.clients || [];
  const employees = reportData?.employees || [];
  const employeesToPrint = employees.filter((emp: any) => selectedEmployees.includes(emp.id));

  const total = employees.length;
  const completed = employees.filter((e: any) => e.conclusion?.fitness).length;
  const pending = total - completed;
  const fitCount = employees.filter((e: any) => e.conclusion?.fitness === 'FIT').length;
  const unfitCount = employees.filter((e: any) => e.conclusion?.fitness === 'UNFIT').length;
  const followUpCount = employees.filter((e: any) => e.conclusion?.fitness === 'FOLLOW-UP' || e.conclusion?.fitness === 'FIT WITH CONDITION').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          
          /* Show only the active print mode wrapper */
          #print-root, #print-root * { visibility: visible; }
          .print-hide { display: none !important; }
          
          #print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0; padding: 0; }
          
          /* Mode Toggles */
          .mode-MEDICAL .vision-wrapper { display: none !important; }
          .mode-VISION .medical-wrapper { display: none !important; }

          /* Medical Page Format */
          .print-container-medical { 
            position: relative; width: 21cm; height: 27.7cm; max-height: 27.7cm;
            padding-top: ${marginTop}; padding-bottom: ${marginBottom};
            padding-left: ${marginLeft}; padding-right: ${marginRight};
            box-sizing: border-box; page-break-after: always; background: white; margin: 0 auto; overflow: hidden; display: block;
          }
          
          /* Vision Page Format (Ultra-Tight) */
          .print-container-vision {
            position: relative; width: 210mm; height: 297mm;
            padding-top: ${marginTop}; padding-bottom: ${marginBottom};
            padding-left: ${marginLeft}; padding-right: ${marginRight};
            box-sizing: border-box; page-break-after: always; page-break-inside: avoid; background: white; margin: 0 auto; overflow: hidden;
            display: flex; flex-direction: column;
          }

          .print-container-medical:last-child, .print-container-vision:last-child { page-break-after: auto; }
        }
      `}} />

      <div className="print-hide space-y-6">
        <div className="border-b pb-4 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#002642]">Client-Wise Medical Reports & Export</h1>
            <p className="text-gray-500 mt-1">Manage camp rosters, export client Excel sheets, and batch print certificates.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleExportExcel}
              disabled={!selectedCampId || employees.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              📊 Export Excel
            </button>
            <button 
              onClick={handlePrintMedical}
              disabled={selectedEmployees.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold shadow transition flex items-center gap-2 ${
                selectedEmployees.length > 0 ? "bg-[#008C8C] hover:bg-[#006b6b] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              🖨️ Print Medical ({selectedEmployees.length})
            </button>
            {/* NEW BUTTON FOR VISION BATCH PRINT */}
            <button 
              onClick={handlePrintVision}
              disabled={selectedEmployees.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold shadow transition flex items-center gap-2 ${
                selectedEmployees.length > 0 ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              👁️ Print Vision ({selectedEmployees.length})
            </button>
          </div>
        </div>

        <div className="bg-[#002642] p-6 rounded-2xl shadow-md text-white space-y-3">
          <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider">Select Client Organization & Camp</label>
          <select 
            className="w-full p-3.5 rounded-xl text-gray-900 font-bold outline-none cursor-pointer" 
            value={selectedCampId} 
            onChange={(e) => { setSelectedCampId(e.target.value); setSelectedEmployees([]); }}
          >
            <option value="">-- Choose Client Organization & Camp --</option>
            {clients.map((client: any) => (
              <optgroup key={client.id} label={`🏢 Client: ${client.name} (${client.clientCode || 'CODE'})`}>
                {client.camps?.map((camp: any) => (
                  <option key={camp.id} value={camp.id}>
                    ⛺ Camp: {camp.campName} — Date: ({new Date(camp.campDate).toLocaleDateString()})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedCampId && !reportsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Roster</p><p className="text-2xl font-black text-[#002642]">{total}</p></div>
            <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 text-center"><p className="text-xs font-bold text-green-700 uppercase tracking-wider">Fit</p><p className="text-2xl font-black text-green-700">{fitCount}</p></div>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-gray-200 text-center"><p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Follow-Up</p><p className="text-2xl font-black text-yellow-700">{followUpCount}</p></div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-gray-200 text-center"><p className="text-xs font-bold text-red-700 uppercase tracking-wider">Unfit</p><p className="text-2xl font-black text-red-700">{unfitCount}</p></div>
            <div className="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-300 text-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p><p className="text-2xl font-black text-gray-700">{pending}</p></div>
          </div>
        )}

        {selectedCampId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-[#002642] text-sm uppercase">Employees in Selected Camp</span>
              <span className="text-xs text-gray-500 font-semibold">Select rows for batch print, or click "Move" to reassign camp</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4 w-12 text-center"><input type="checkbox" className="w-4 h-4 cursor-pointer accent-[#008C8C]" checked={employees.length > 0 && selectedEmployees.length === employees.length} onChange={toggleSelectAll} /></th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name & Role</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiers & Sr No</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fitness Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Quick Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsLoading ? <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold">Loading Roster...</td></tr> : employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-teal-50/30 transition">
                    <td className="p-4 text-center" onClick={() => toggleEmployee(emp.id)}><input type="checkbox" className="w-4 h-4 cursor-pointer accent-[#008C8C]" checked={selectedEmployees.includes(emp.id)} readOnly /></td>
                    <td className="p-4 cursor-pointer" onClick={() => toggleEmployee(emp.id)}><p className="font-bold text-[#002642] uppercase">{emp.name}</p><p className="text-xs text-gray-500">{emp.department || "-"} | {emp.designation || "-"}</p></td>
                    <td className="p-4 cursor-pointer" onClick={() => toggleEmployee(emp.id)}><p className="font-mono text-xs font-bold text-[#008C8C]">SR: {emp.serialNo}</p><p className="font-mono text-[11px] text-gray-400">UHID: {emp.uhid}</p></td>
                    <td className="p-4 cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                        emp.conclusion?.fitness === 'FIT' ? 'bg-green-100 text-green-800' :
                        emp.conclusion?.fitness === 'UNFIT' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {emp.conclusion?.fitness || emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {movingEmpId === emp.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="border text-xs p-1.5 rounded font-bold bg-white"
                            value={targetCampId}
                            onChange={(e) => setTargetCampId(e.target.value)}
                          >
                            <option value="">-- Target Camp --</option>
                            {clients.map((c: any) => c.camps?.map((cp: any) => (
                              cp.id !== selectedCampId && <option key={cp.id} value={cp.id}>{c.name} - {cp.campName}</option>
                            )))}
                          </select>
                          <button onClick={() => handleMoveCamp(emp.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold">Save</button>
                          <button onClick={() => setMovingEmpId(null)} className="text-gray-400 font-bold text-xs">✕</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setMovingEmpId(emp.id); setTargetCampId(""); }}
                          className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm"
                        >
                          🔄 Move
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DUAL BATCH PRINTABLE CONTAINER --- */}
      <div id="print-root" className={`hidden print:block mode-${printMode} text-black bg-white`}>
        
        {/* 1. MEDICAL REPORTS WRAPPER */}
        <div className="medical-wrapper space-y-0">
          {employeesToPrint.map((emp: any) => {
            const fitness = emp.conclusion?.fitness || "FIT";
            const remarks = emp.conclusion?.remarks || "Clinically Fit for Duty";
            const exactCampDate = emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

            return (
              <div key={`med-${emp.id}`} className="print-container-medical text-[11px] text-gray-800">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#002642]">Medical Examination Report</h2>
                  <div className="w-12 h-0.5 bg-[#008C8C] mx-auto mt-1"></div>
                </div>

                <p className="text-right text-[10px] font-semibold text-gray-600 mb-2">Exam Date: {exactCampDate}</p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] mb-3 bg-gray-50/50 p-2.5 rounded border border-gray-100">
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Client Organization:</span> <span className="font-bold text-black uppercase">{emp.camp?.client?.name || "-"}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Serial No:</span> <span className="font-bold text-[#008C8C]">SR-{emp.serialNo}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Name:</span> <span className="font-bold text-black uppercase">{emp.name}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Emp Code:</span> <span className="font-bold text-black">{emp.empCode || "-"}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Age / Sex:</span> <span className="font-bold text-black">{emp.age || "-"} Yrs / {emp.sex || "-"}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Department:</span> <span className="font-bold text-black">{emp.department || "-"}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Contact No:</span> <span className="font-bold text-black">{emp.contactNo || "-"}</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5"><span className="font-semibold text-gray-600">Height / Weight:</span> <span className="font-bold text-black">{emp.vitals?.height || "-"} cm / {emp.vitals?.weight || "-"} kg</span></div>
                  <div className="grid grid-cols-2 border-b border-dashed py-0.5 col-span-2"><span className="font-semibold text-gray-600">BMI:</span> <span className="font-bold text-black">{emp.vitals?.bmi || "-"}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <h3 className="bg-gray-200 text-black px-2 py-1 font-bold text-[10px] mb-1.5 text-center border border-black uppercase">Medical History & Examination</h3>
                    <table className="w-full text-[10px]">
                      <tbody>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold w-1/2">Past History</td><td className="py-0.5 font-bold">{emp.examination?.pastHistory || "Nil"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Co-Morbidities</td><td className="py-0.5 font-bold">{emp.examination?.comorbidities || "Nil"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Heart Rate</td><td className="py-0.5 font-bold">{emp.vitals?.heartRate || "-"} bpm</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Blood Pressure</td><td className="py-0.5 font-bold">{emp.vitals?.bloodPress || "-"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">SpO2</td><td className="py-0.5 font-bold">{emp.vitals?.spO2 || "-"} %</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Eyes (R / L)</td><td className="py-0.5 font-bold">{emp.examination?.eyeRight || "6/6"} / {emp.examination?.eyeLeft || "6/6"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Color Blindness</td><td className="py-0.5 font-bold">{emp.examination?.colorBlindness || "Normal"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">ENT / Oral</td><td className="py-0.5 font-bold">{emp.examination?.ent || "Normal"} / {emp.examination?.oral || "Normal"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Lungs & Chest</td><td className="py-0.5 font-bold">{emp.examination?.lungsChest || "Clear"}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">CardioVascular</td><td className="py-0.5 font-bold">{emp.examination?.cardiovascular || "Normal S1 S2"}</td></tr>
                        
                        {emp.xrayStatus && emp.xrayStatus !== "N/A" && <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">X-Ray Chest</td><td className="py-0.5 font-bold">{getDiagnosticPrintStatus(emp.xrayStatus)}</td></tr>}
                        {emp.ecgStatus && emp.ecgStatus !== "N/A" && <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">ECG</td><td className="py-0.5 font-bold">{getDiagnosticPrintStatus(emp.ecgStatus)}</td></tr>}
                        {emp.pftStatus && emp.pftStatus !== "N/A" && <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">PFT</td><td className="py-0.5 font-bold">{getDiagnosticPrintStatus(emp.pftStatus)}</td></tr>}
                        {emp.audioStatus && emp.audioStatus !== "N/A" && <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Audiometry</td><td className="py-0.5 font-bold">{getDiagnosticPrintStatus(emp.audioStatus)}</td></tr>}
                        
                        {emp.diagnosticRemarks && (
                          <tr className="border-b bg-gray-50">
                            <td className="py-0.5 text-gray-700 font-bold align-top">Scans Note:</td>
                            <td className="py-0.5 font-bold text-black italic">{emp.diagnosticRemarks}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="bg-gray-200 text-black px-2 py-1 font-bold text-[10px] mb-1.5 text-center border border-black uppercase">Laboratory Investigations</h3>
                    <table className="w-full text-[10px]">
                      <tbody>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold w-1/2">Blood Group</td><td className="py-0.5 font-bold">{getLab(emp, 'Blood Group')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Hb</td><td className="py-0.5 font-bold">{getLab(emp, 'Hb')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">WBC</td><td className="py-0.5 font-bold">{getLab(emp, 'WBC')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Platelets</td><td className="py-0.5 font-bold">{getLab(emp, 'Platelets')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">ESR</td><td className="py-0.5 font-bold">{getLab(emp, 'ESR')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">SGPT</td><td className="py-0.5 font-bold">{getLab(emp, 'SGPT')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">S. Creatinine</td><td className="py-0.5 font-bold">{getLab(emp, 'Creatinine')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">RBS</td><td className="py-0.5 font-bold">{getLab(emp, 'RBS')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Widal Profile</td><td className="py-0.5 font-bold">{getLab(emp, 'Widal')}</td></tr>
                        <tr className="border-b"><td className="py-0.5 text-gray-600 font-semibold">Urine R/M</td><td className="py-0.5 font-bold">{getLab(emp, 'Urine')}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-black p-2 mt-2 flex flex-col items-center bg-gray-50">
                  <h3 className="text-xs font-black mb-0.5 uppercase tracking-wider">Final Conclusion</h3>
                  <p className="text-base font-bold text-black mb-0.5">{fitness}</p>
                  <p className="text-[11px] font-semibold text-gray-700 uppercase italic">"{remarks}"</p>
                </div>

                <div className="mt-8 flex justify-between items-end">
                  <div className="text-center">
                    <div className="w-36 border-b border-black mb-1"></div>
                    <p className="text-[9px] font-bold uppercase tracking-wider">Candidate Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-black mb-1"></div>
                    <p className="text-[9px] font-bold uppercase tracking-wider">Authorized Doctor Signature</p>
                    <p className="text-[8px] text-gray-500 font-semibold">Dr. {emp.camp?.leadDoctor || "Ankitkumar Patel"} (Vyora Healthcare)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. VISION REPORTS WRAPPER (TIGHTENED FORMAT) */}
        <div className="vision-wrapper space-y-0">
          {employeesToPrint.map((emp: any) => {
            const exactCampDate = emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
            const rightEye = emp.examination?.eyeRight || "";
            const leftEye = emp.examination?.eyeLeft || "";
            const colorBlindness = emp.examination?.colorBlindness || "Normal";

            return (
              <div key={`vis-${emp.id}`} className="print-container-vision text-[12px] text-gray-800">
                <div className="flex justify-end mb-2">
                  <h2 className="text-[16px] font-bold text-black uppercase tracking-wide border-b border-black pb-0.5 inline-block">
                    EYE CHECK UP
                  </h2>
                </div>

                <div className="border border-black p-2 mb-3 leading-tight">
                  <div className="flex flex-wrap gap-x-8 gap-y-1 mb-1 border-b border-gray-300 pb-1">
                    <div className="flex-1 min-w-[250px]"><span className="font-semibold">Name of Patient :</span> <span className="font-bold border-b border-black px-4">{emp.name}</span></div>
                    <div><span className="font-semibold">UHID No.:</span> <span className="font-bold border-b border-black px-4">{emp.uhid}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-1 mb-1 border-b border-gray-300 pb-1">
                    <div className="flex-1 min-w-[200px]"><span className="font-semibold">Company / Client :</span> <span className="font-bold border-b border-black px-4 uppercase">{emp.camp?.client?.name || "-"}</span></div>
                    <div><span className="font-semibold">Age:</span> <span className="font-bold border-b border-black px-2">{emp.age || "-"}</span></div>
                    <div><span className="font-semibold">Sex:</span> <span className="font-bold border-b border-black px-2">{emp.sex || "-"}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-1 mb-1">
                    <div className="flex-1 min-w-[250px]"><span className="font-semibold">Attending Consultant :</span> <span className="border-b border-black px-16 inline-block"></span></div>
                    <div><span className="font-semibold">Date :</span> <span className="font-bold border-b border-black px-4">{exactCampDate}</span></div>
                  </div>
                  <div className="mt-1"><span className="font-semibold">Chief Complaints :</span> <span className="border-b border-black px-16 inline-block w-[70%]"></span></div>
                </div>

                <div className="mb-2 flex-1">
                  <h3 className="font-bold mb-1">Examination of Eye :</h3>
                  <p className="font-semibold ml-4 mb-1">1. Vision :</p>
                  
                  <div className="ml-8 mb-2">
                    <table className="w-[85%] border-collapse border border-black text-center text-[12px]">
                      <thead>
                        <tr><th className="border border-black p-0.5 w-1/2">Visual</th><th className="border border-black p-0.5 w-1/4">Right</th><th className="border border-black p-0.5 w-1/4">Left</th></tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-black p-0.5 text-left pl-2">With Glasses ( Corrected )</td><td className="border border-black p-0.5 h-4"></td><td className="border border-black p-0.5 h-4"></td></tr>
                        <tr><td className="border border-black p-0.5 text-left pl-2">Without Glasses ( Uncorrected )</td><td className="border border-black p-0.5 font-bold h-4">{rightEye}</td><td className="border border-black p-0.5 font-bold h-4">{leftEye}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="ml-8 mb-3">
                    <table className="w-[85%] border-collapse border border-black text-center text-[12px]">
                      <thead>
                        <tr><th className="border border-black p-0.5 w-[10%]"></th><th className="border border-black p-0.5 w-[20%]"></th><th className="border border-black p-0.5">Sph.</th><th className="border border-black p-0.5">Cyl</th><th className="border border-black p-0.5">Axis</th><th className="border border-black p-0.5">Vn</th></tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-black p-0 font-semibold" rowSpan={2}>RE</td><td className="border border-black p-0 text-left pl-2">Distance</td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td></tr>
                        <tr><td className="border border-black p-0 text-left pl-2">Near</td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td></tr>
                        <tr><td className="border border-black p-0 font-semibold" rowSpan={2}>LE</td><td className="border border-black p-0 text-left pl-2">Distance</td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td></tr>
                        <tr><td className="border border-black p-0 text-left pl-2">Near</td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td><td className="border border-black p-0 h-4"></td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="ml-4 space-y-1.5">
                    <div>
                      <p className="font-semibold mb-0.5">2. SLE (Slit lamp examinations)</p>
                      <div className="ml-6 leading-tight">
                        <p>1. Cornea <span className="ml-6">:</span></p>
                        <p>2. Conjunctiva <span className="ml-1">:</span></p>
                        <p>3. Iris <span className="ml-11">:</span></p>
                        <p>4. Pupil <span className="ml-8">:</span></p>
                        <p>5. Lens <span className="ml-9">:</span></p>
                      </div>
                    </div>
                    <p className="font-semibold">3. Eye Movement <span className="ml-3">:</span></p>
                    <p className="font-semibold">4. Tonometry <span className="ml-9">:</span></p>
                    <p className="font-semibold">5. Fundus <span className="ml-12">:</span></p>
                    <p className="font-semibold">6. Color Vision <span className="ml-6">:</span> <span className="font-normal border-b border-black px-4 ml-2">{colorBlindness}</span></p>
                    <p className="font-semibold">7. Remark <span className="ml-11">:</span></p>
                    <p className="font-semibold pt-1">Clinical Advice :</p>
                  </div>
                </div>

                <div className="mt-auto flex justify-between items-end pb-2">
                  <div className="text-center"><p className="font-bold text-[13px]">Ophthalmologist</p><p className="text-[12px]">MS (Opthal)</p></div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}