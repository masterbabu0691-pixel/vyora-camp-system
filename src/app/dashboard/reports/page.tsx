"use client";
import { useState } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientReportsPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  
  // 1. Fetch Dynamic Margins from Super Admin DB
  const { data: settingsData } = useSWR('/api/settings', fetcher);
  
  const getMargin = (key: string, fallback: string) => 
    settingsData?.settings?.find((s: any) => s.settingKey === key)?.settingVal || fallback;

  const marginTop = getMargin('MARGIN_TOP', '4.5cm');
  const marginBottom = getMargin('MARGIN_BOTTOM', '2cm');
  const marginLeft = getMargin('MARGIN_LEFT', '1.5cm');
  const marginRight = getMargin('MARGIN_RIGHT', '1.5cm');

  // 2. Fetch Employees for selected camp
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

  // Excel Export Function for the Selected Camp
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
    // Returns result + unit (e.g., "14.2 g/dL")
    return `${test.result} ${test.unit || ""}`.trim();
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
          @page { size: 21cm 27.7cm; margin: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-hide { display: none !important; }
          
          .print-container { 
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important; 
            height: 27.7cm !important; 
            max-height: 27.7cm !important;
            padding-top: ${marginTop} !important; 
            padding-bottom: ${marginBottom} !important;
            padding-left: ${marginLeft} !important; 
            padding-right: ${marginRight} !important; 
            box-sizing: border-box !important; 
            page-break-after: always; 
            background: white;
            margin: 0 !important;
            display: block !important;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
        }
      `}} />

      <div className="print-hide space-y-6">
        <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#002642]">Client-Wise Medical Reports & Export</h1>
            <p className="text-gray-500 mt-1">Manage camp rosters, export client Excel sheets, and batch print certificates.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportExcel}
              disabled={!selectedCampId || employees.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              📊 Export Excel
            </button>
            <button 
              onClick={handlePrint}
              disabled={selectedEmployees.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold shadow transition flex items-center gap-2 ${
                selectedEmployees.length > 0 ? "bg-[#008C8C] hover:bg-[#006b6b] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              🖨️ Print Selected ({selectedEmployees.length})
            </button>
          </div>
        </div>

        {/* Client-Wise Camp Distribution Selector */}
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
              <span className="text-xs text-gray-500 font-semibold">Click row to select/deselect for batch printing</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4 w-12 text-center"><input type="checkbox" className="w-4 h-4 cursor-pointer accent-[#008C8C]" checked={employees.length > 0 && selectedEmployees.length === employees.length} onChange={toggleSelectAll} /></th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name & Role</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiers & Sr No</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fitness Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsLoading ? <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">Loading Roster...</td></tr> : employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-teal-50/30 transition cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                    <td className="p-4 text-center"><input type="checkbox" className="w-4 h-4 pointer-events-none accent-[#008C8C]" checked={selectedEmployees.includes(emp.id)} readOnly /></td>
                    <td className="p-4"><p className="font-bold text-[#002642] uppercase">{emp.name}</p><p className="text-xs text-gray-500">{emp.department || "-"} | {emp.designation || "-"}</p></td>
                    <td className="p-4"><p className="font-mono text-xs font-bold text-[#008C8C]">SR: {emp.serialNo}</p><p className="font-mono text-[11px] text-gray-400">UHID: {emp.uhid}</p></td>
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

      {/* PRINTABLE CONTAINER (Pulls exact Camp Date from Client Manager) */}
      <div className="hidden print:block text-black bg-white">
        {employeesToPrint.map((emp: any) => {
          const fitness = emp.conclusion?.fitness || "FIT";
          const remarks = emp.conclusion?.remarks || "Clinically Fit for Duty";
          const exactCampDate = emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

          return (
            <div key={emp.id} className="print-container bg-white text-[11px] text-gray-800">
              
              <div className="text-center mb-3">
                <h2 className="text-lg font-black uppercase tracking-widest text-[#002642]">Medical Examination Report</h2>
                <div className="w-12 h-0.5 bg-[#008C8C] mx-auto mt-1"></div>
              </div>

              <p className="text-right text-[10px] font-semibold text-gray-600 mb-2">
                Exam Date: {exactCampDate}
              </p>

              {/* Demographics Grid */}
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
                {/* Medical History & Examination */}
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
                    </tbody>
                  </table>
                </div>

                {/* Blood Investigations */}
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

              {/* Conclusion Section */}
              <div className="border border-black p-2 mt-2 flex flex-col items-center bg-gray-50">
                <h3 className="text-xs font-black mb-0.5 uppercase tracking-wider">Final Conclusion</h3>
                <p className="text-base font-bold text-black mb-0.5">{fitness}</p>
                <p className="text-[11px] font-semibold text-gray-700 uppercase italic">"{remarks}"</p>
              </div>

              {/* Footer Signature */}
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
    </div>
  );
}