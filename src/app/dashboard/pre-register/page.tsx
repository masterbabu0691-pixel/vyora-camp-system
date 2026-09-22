"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PreRegistrationPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [saving, setSaving] = useState(false);
  
  const { data: empData, mutate: refreshEmployees } = useSWR(
    selectedCampId ? `/api/pre-register?campId=${selectedCampId}` : null, fetcher
  );

  // Added designation to form state
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
            <h2 className="text-lg font-bold text-[#008C8C] mb-4">2. Add Employee Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500">Full Name *</label><input id="nameInput" required type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500">Emp Code</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.empCode} onChange={e => setForm({...form, empCode: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500">Department</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              </div>

              {/* Added Designation Input */}
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
            <h2 className="text-lg font-bold text-[#002642] mb-4">3. Roster</h2>
            <div className="overflow-y-auto max-h-125 border-t pt-2">
              <ul className="divide-y divide-gray-100">
                {empData?.employees?.map((emp: any) => (
                  <li key={emp.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#002642]">{emp.name} <span className="text-xs text-gray-400 font-normal ml-2">{emp.age ? `${emp.age}y` : ""} {emp.sex ? `| ${emp.sex.charAt(0)}` : ""}</span></p>
                      {/* Added Designation Display */}
                      <p className="text-xs text-gray-500">Code: {emp.empCode || "-"} | Dept: {emp.department || "-"} | Desig: <span className="font-bold">{emp.designation || "-"}</span></p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}