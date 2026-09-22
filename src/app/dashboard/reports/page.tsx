"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportsPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  
  const { data: reportData, isLoading: reportLoading } = useSWR(
    selectedCampId ? `/api/reports?campId=${selectedCampId}` : null, fetcher
  );

  const clients = clientData?.clients || [];
  const employees = reportData?.data || [];

  // --- EXCEL (CSV) EXPORT LOGIC ---
  const handleExportExcel = () => {
    if (employees.length === 0) return alert("No data to export.");

    // Define column headers
    const headers = ["Status", "Emp Code", "Name", "Department", "Designation", "Age", "Sex", "Contact No", "Height (cm)", "Weight (kg)", "BMI"];
    const csvRows = [headers.join(",")];

    // Map employee data to rows
    employees.forEach((emp: any) => {
      const row = [
        emp.status,
        emp.empCode || "-",
        `"${emp.name}"`, // Quotes prevent commas in names from breaking the columns
        `"${emp.department || "-"}"`,
        `"${emp.designation || "-"}"`,
        emp.age || "-",
        emp.sex || "-",
        emp.contactNo || "-",
        emp.vitals?.height || "-",
        emp.vitals?.weight || "-",
        emp.vitals?.bmi || "-"
      ];
      csvRows.push(row.join(","));
    });

    // Create and download the file
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vyora_Camp_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = () => {
    window.print();
  };

  // Get the selected camp name for the PDF title
  const getCampTitle = () => {
    for (const client of clients) {
      for (const camp of client.camps) {
        if (camp.id === selectedCampId) return `${client.name} - ${camp.campName}`;
      }
    }
    return "Medical Camp Report";
  };

  return (
    // Note the "print:m-0 print:p-0" classes to make it full width when printing
    <div className="max-w-7xl mx-auto space-y-6 print:m-0 print:p-0 print:w-full print:max-w-none">
      
      <div className="border-b pb-4 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Master Client Reports</h1>
          <p className="text-gray-500 mt-1">Select a client to view and export their complete medical camp data.</p>
        </div>
      </div>

      <div className="bg-[#002642] p-6 rounded-xl shadow-md text-white print:hidden">
        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">1. Select Target Camp</label>
        <select 
          className="w-full p-3 rounded-md text-gray-900 font-bold outline-none" 
          value={selectedCampId} 
          onChange={(e) => setSelectedCampId(e.target.value)}
        >
          <option value="">-- Choose a Client & Camp --</option>
          {clients.map((client: any) => client.camps.map((camp: any) => (
            <option key={camp.id} value={camp.id}>{client.name} - {camp.campName}</option>
          )))}
        </select>
      </div>

      {selectedCampId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none print:p-0">
          
          {/* Header containing the Export Buttons (Hidden on actual print) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
            <div>
              <h2 className="text-xl font-bold text-[#008C8C]">Camp Data View</h2>
              <span className="text-gray-500 text-sm font-bold mt-1 block">Total Records: {employees.length}</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleExportExcel} 
                className="bg-green-600 text-white px-5 py-2 rounded-md font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
              >
                📊 Download Excel
              </button>
              <button 
                onClick={handleExportPDF} 
                className="bg-red-600 text-white px-5 py-2 rounded-md font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
              >
                🖨 Save as PDF
              </button>
            </div>
          </div>

          {/* Special Header only visible when printing the PDF */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-black text-black uppercase underline">Vyora Healthcare - Camp Report</h1>
            <h2 className="text-lg font-bold text-gray-800 mt-2">{getCampTitle()}</h2>
            <p className="text-sm font-bold text-gray-500 mt-1">Total Employees Checked: {employees.length}</p>
          </div>

          {reportLoading ? (
            <div className="p-8 font-bold text-[#002642] text-center print:hidden">Loading Report Data...</div>
          ) : (
            <div className="overflow-x-auto border rounded-lg print:border-none print:overflow-visible">
              <table className="w-full text-left text-sm whitespace-nowrap print:whitespace-normal">
                <thead className="bg-[#002642] text-white print:bg-gray-200 print:text-black">
                  <tr>
                    <th className="p-3 print:border-b-2 print:border-black">Status</th>
                    <th className="p-3 print:border-b-2 print:border-black">Emp Code</th>
                    <th className="p-3 print:border-b-2 print:border-black">Name</th>
                    <th className="p-3 print:border-b-2 print:border-black">Department</th>
                    <th className="p-3 bg-[#003865] print:bg-transparent print:border-b-2 print:border-black">Designation</th>
                    <th className="p-3 print:border-b-2 print:border-black">Age/Sex</th>
                    <th className="p-3 print:border-b-2 print:border-black">Contact No</th>
                    <th className="p-3 print:border-b-2 print:border-black">Height/Weight</th>
                    <th className="p-3 print:border-b-2 print:border-black">BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 print:divide-black">
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-gray-50 print:break-inside-avoid">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold print:bg-transparent print:p-0 ${emp.status === 'COMPLETED' ? 'bg-green-100 text-green-700 print:text-black' : 'bg-amber-100 text-amber-700 print:text-black'}`}>
                          {emp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{emp.empCode || "-"}</td>
                      <td className="p-3 font-bold text-[#002642] print:text-black">{emp.name}</td>
                      <td className="p-3">{emp.department || "-"}</td>
                      <td className="p-3 bg-gray-50 font-bold print:bg-transparent">{emp.designation || "-"}</td>
                      <td className="p-3">{emp.age || "-"} / {emp.sex?.charAt(0) || "-"}</td>
                      <td className="p-3">{emp.contactNo || "-"}</td>
                      <td className="p-3">{emp.vitals?.height || "-"}cm / {emp.vitals?.weight || "-"}kg</td>
                      <td className="p-3 font-semibold">{emp.vitals?.bmi || "-"}</td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={9} className="p-8 text-center text-gray-400 font-bold">No employees registered for this camp yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}