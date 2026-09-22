"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReceptionPage() {
  const { data: apiData, mutate: refreshData } = useSWR('/api/reception', fetcher);
  
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(session => {
      if (session?.user?.role === "SUPER_ADMIN") setIsAdmin(true);
    });
  }, []);

  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Added designation & department
  const emptyForm = { id: "", name: "", empCode: "", department: "", designation: "", age: "", sex: "Male", contactNo: "", height: "", weight: "", bmi: "" };
  const [form, setForm] = useState(emptyForm);

  const preRegistered = apiData?.preRegistered || [];
  const recentCheckIns = apiData?.recentCheckIns || [];
  
  const searchResults = search ? preRegistered.filter((emp: any) => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    (emp.empCode && emp.empCode.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const handleSelectPatient = (emp: any) => {
    setIsEditMode(false);
    setForm({ ...emptyForm, id: emp.id, name: emp.name, empCode: emp.empCode || "", department: emp.department || "", designation: emp.designation || "", age: emp.age?.toString() || "", sex: emp.sex || "Male", contactNo: emp.contactNo || "" });
    setSearch(""); 
  };

  const handleEditPastPatient = (emp: any) => {
    setIsEditMode(true);
    setForm({
      id: emp.id, name: emp.name, empCode: emp.empCode || "", department: emp.department || "", designation: emp.designation || "",
      age: emp.age?.toString() || "", sex: emp.sex || "Male", contactNo: emp.contactNo || "",
      height: emp.vitals?.height?.toString() || "", weight: emp.vitals?.weight?.toString() || "", bmi: emp.vitals?.bmi?.toString() || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVitalsChange = (field: 'height' | 'weight', value: string) => {
    const updated = { ...form, [field]: value };
    const h = parseFloat(updated.height) / 100; 
    const w = parseFloat(updated.weight);
    if (h > 0 && w > 0) updated.bmi = (w / (h * h)).toFixed(1);
    else updated.bmi = "";
    setForm(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reception", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, isEditMode }) });
    const result = await res.json();
    if (res.ok) {
      alert(result.message); setForm(emptyForm); setIsEditMode(false); refreshData();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!form.id) return alert("Select a patient to delete.");
    if (!confirm(`WARNING: Are you sure you want to permanently delete ${form.name}?`)) return;
    await fetch(`/api/reception?id=${form.id}`, { method: "DELETE" });
    alert("Record deleted."); setForm(emptyForm); setIsEditMode(false); refreshData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-[#002642]">Reception Desk</h1>
        <p className="text-gray-500 mt-1">Search pre-registered patients to check them in, or edit recent entries.</p>
      </div>

      <div className="relative">
        <input type="text" placeholder="🔍 Search Pre-Registered Patients to Check-In..." className="w-full p-4 rounded-xl border-2 border-[#008C8C] shadow-sm text-lg font-bold outline-none focus:ring-4 ring-teal-50" value={search} onChange={(e) => setSearch(e.target.value)} />
        {searchResults.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border-2 border-t-0 border-[#008C8C] rounded-b-xl shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((emp: any) => (
              <li key={emp.id} className="p-4 hover:bg-teal-50 cursor-pointer border-b last:border-0" onClick={() => handleSelectPatient(emp)}>
                <span className="font-bold text-[#002642]">{emp.name}</span> <span className="text-sm text-gray-500 ml-2">(Code: {emp.empCode || "N/A"}) - {emp.designation || "No Designation"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`p-8 rounded-xl shadow-sm border-2 ${isEditMode ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-100'}`}>
        {isEditMode ? (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-700">✏️ Editing Past Details</h2>
            <button type="button" onClick={() => { setForm(emptyForm); setIsEditMode(false); }} className="text-sm font-bold text-gray-500 hover:text-gray-800">Cancel Edit ✖</button>
          </div>
        ) : form.id ? (
          <div className="bg-teal-50 text-teal-800 p-3 rounded-md font-bold mb-6 text-sm border border-teal-200">✓ Pre-Registered Profile Loaded. Please complete missing vitals.</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700">Full Name</label><input required type="text" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="block text-sm font-bold text-gray-700">Employee Code</label><input type="text" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.empCode} onChange={e => setForm({...form, empCode: e.target.value})} /></div>
          <div><label className="block text-sm font-bold text-gray-700">Contact Number</label><input type="text" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div><label className="block text-sm font-bold text-gray-700">Department</label><input type="text" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
          {/* ADDED DESIGNATION FIELD */}
          <div><label className="block text-sm font-bold text-gray-700">Designation</label><input type="text" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} /></div>
          
          <div><label className="block text-sm font-bold text-gray-700">Age</label><input required type="number" className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></div>
          <div><label className="block text-sm font-bold text-gray-700">Gender</label><select className="mt-1 w-full border-2 p-3 rounded-md font-semibold bg-white" value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
        </div>

        <h3 className="font-bold text-[#002642] border-b pb-2 mb-4">Initial Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div><label className="block text-sm font-bold text-gray-700">Height (cm)</label><input required type="number" step="0.1" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold focus:border-blue-500 bg-white" value={form.height} onChange={e => handleVitalsChange('height', e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-gray-700">Weight (kg)</label><input required type="number" step="0.1" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold focus:border-blue-500 bg-white" value={form.weight} onChange={e => handleVitalsChange('weight', e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-gray-700">Calculated BMI</label><input readOnly type="text" className="mt-1 w-full border-2 border-transparent bg-gray-100 p-3 rounded-md font-black text-gray-600" value={form.bmi} placeholder="Auto" /></div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {isAdmin && form.id ? <button type="button" onClick={handleDelete} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-md transition">🗑 Delete Record</button> : <div></div>}
          <button type="submit" disabled={saving} className={`text-white px-8 py-3 rounded-md font-bold text-lg transition shadow-md disabled:opacity-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#002642] hover:bg-[#003865]'}`}>
            {saving ? "Processing..." : isEditMode ? "💾 Save Corrections" : "Complete Check-In →"}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#002642] mb-4">Recent Registrations</h2>
        {recentCheckIns.length === 0 ? <p className="text-gray-500 text-sm">No patients checked in yet today.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Age/Sex</th>
                  <th className="p-3">Queue Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentCheckIns.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#002642]">{emp.name}</td>
                    <td className="p-3 text-sm font-semibold">{emp.designation || "-"}</td>
                    <td className="p-3 text-sm">{emp.age} / {emp.sex?.charAt(0)}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">{emp.status.replace('_', ' ')}</span></td>
                    <td className="p-3"><button onClick={() => handleEditPastPatient(emp)} className="text-[#008C8C] font-bold text-sm hover:underline">Edit Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}