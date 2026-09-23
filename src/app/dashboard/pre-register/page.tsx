"use client";
import { useState } from "react";
import useSWR from "swr";
import * as XLSX from 'xlsx';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PreRegistrationPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { data: empData, mutate: refreshEmployees } = useSWR(
    selectedCampId ? `/api/pre-register?campId=${selectedCampId}` : null, fetcher
  );

  const [form, setForm] = useState({ name: "", empCode: "", department: "", designation: "", age: "", sex: "", contactNo: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId) return alert("Please select a camp first!");
    
    setSaving(true);
    const res = await fetch("/api/pre-register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, campId: selectedCampId })
    });
    
    if (res.ok) {
      setForm({ name: "", empCode: "", department: "", designation: "", age: "", sex: "", contactNo: "" });
      refreshEmployees();
      document.getElementById("nameInput")?.focus(); 
    }
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCampId) {
      alert("Please select a camp first before uploading!");
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" }); 
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // Precisely mapped to match your Excel column headers: Name, Emp Code, Department, Designation, Age, Gender, Contact
      const mappedEmployees = jsonData.map((row: any) => ({
        name: String(row['Name'] || row['Employee Name'] || row['Patient Name'] || row['Full Name'] || '').trim(),
        empCode: String(row['Emp Code'] || row['Code'] || row['Employee Code'] || row['Emp ID'] || '').trim(),
        department: String(row['Department'] || row['Dept'] || '').trim(),
        designation: String(row['Designation'] || row['Role'] || row['Job Role'] || '').trim(),
        age: row['Age'] !== '' && !isNaN(Number(row['Age'])) ? parseInt(row['Age']) : null,
        sex: String(row['Gender'] || row['Sex'] || '').trim(),
        contactNo: row['Contact'] !== undefined ? String(row['Contact']).trim() : ''
      })).filter((emp: any) => emp.name !== '');

      if (mappedEmployees.length === 0) {
        alert("No valid employees found. Ensure your column header is exactly 'Name'.");
        setUploading(false);
        e.target.value = '';
        return;
      }

      const response = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campId: selectedCampId, employees: mappedEmployees }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert(`Successfully uploaded ${result.count} employees!`);
        refreshEmployees();
      } else {
        alert("Database Error: " + (result.error || "Upload failed."));
      }

    } catch (excelError: any) {
      console.error("Excel Parse Error:", excelError);
      alert("Failed to read the Excel file. Check format.");
    } finally {
      setUploading(false);
      e.target.value = ''; 
    }
  };

  // DELETE FUNCTIONALITY FOR EMPLOYEES
  const handleDelete = async (empId: string) => {
    if (confirm("Are you sure you want to delete this employee? This cannot be undone.")) {
      try {
        const res = await fetch(`/api/employees?id=${empId}`, { method: 'DELETE' });
        if (res.ok) {
          refreshEmployees();
        } else {
          alert("Failed to delete employee.");
        }
      } catch (err) {
        alert("Network error while deleting.");
      }
    }
  };

  if (clientsLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading System...</div>;
  const clients = clientData?.clients || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-[#002642]">Camp Pre-Registration</h1>
        <p className="text-gray-500 mt-1">Leave any unknown fields blank; Reception will complete them on-site.</p>
      </div>

      <div className="bg-[#002642] p-6 rounded-xl shadow-md text-white">
        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">1. Select Target Camp</label>
        <select className="w-full p-3 rounded-md text-gray-900 font-bold outline-none" value={selectedCampId} onChange={(e) => setSelectedCampId(e.target.value)}>
          <option value="">-- Choose a Client & Camp --</option>
          {clients.map((client: any) => client.camps.map((camp: any) => (
            <option key={camp.id} value={camp.id}>{client.name} - {camp.campName}</option>
          )))}
        </select>
      </div>

      {selectedCampId && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-[#008C8C] mb-4">2. Add Employee Details (Single Entry)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500">Full Name *</label><input id="nameInput" required type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500">Emp Code</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.empCode} onChange={e => setForm({...form, empCode: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500">Department</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              </div>

              <div><label className="block text-xs font-bold text-gray-500">Designation (Job Role)</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500">Age</label><input type="number" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500">Gender</label><select className="mt-1 w-full border-2 p-2 rounded-md font-semibold text-sm" value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}><option value="">-</option><option>Male</option><option>Female</option></select></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500">Contact No.</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} /></div>
              
              <button type="submit" disabled={saving} className="w-full bg-[#008C8C] text-white py-3 rounded-md font-bold hover:bg-[#006b6b] transition mt-4">{saving ? "Adding..." : "Add to Roster"}</button>
            </form>
          </div>

          <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#002642]">
                3. Roster ({empData?.employees?.length || 0})
              </h2>

              <div>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  id="excel-upload" 
                  className="hidden" 
                  disabled={uploading}
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="excel-upload" 
                  className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg shadow-sm text-white transition ${
                    uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <span>{uploading ? "⏳ Uploading..." : "📊 Upload Excel Roster"}</span>
                </label>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[500px] border-t pt-2">
              <ul className="divide-y divide-gray-100">
                {empData?.employees?.map((emp: any) => (
                  <li key={emp.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#002642]">
                        {emp.name} 
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          {emp.age ? `${emp.age}y` : ""} {emp.sex ? `| ${emp.sex.charAt(0)}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Code: {emp.empCode || "-"} | Dept: {emp.department || "-"} | Desig: <span className="font-bold">{emp.designation || "-"}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition shadow-sm ml-2"
                    >
                      🗑️ Delete
                    </button>
                  </li>
                ))}
                {(!empData?.employees || empData.employees.length === 0) && (
                  <li className="py-8 text-center text-sm text-gray-400">
                    No employees pre-registered for this camp yet.
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}