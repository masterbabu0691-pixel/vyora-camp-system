"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const AVAILABLE_TESTS = [
  "Vitals (BP/BMI)", "Vision", "CBC", "RBS", 
  "Urine Routine", "Stool Culture", "Widal", 
  "ECG", "Sputum", "Audiometry", "X-Ray Chest"
];

export default function ClientManagerPage() {
  const { data, mutate, isLoading } = useSWR('/api/clients', fetcher);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    campName: "",
    campDate: "",
    leadDoctor: "",
    phlebotomist: "",
    campCoordinator: ""
  });

  const [selectedTests, setSelectedTests] = useState<string[]>([
    "Vitals (BP/BMI)", "Vision", "CBC", "RBS", "Urine Routine", "Stool Culture", "Widal"
  ]);

  const toggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      ...form,
      testChecklist: selectedTests.join(",")
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    
    if (result.success) {
      setForm({ name: "", campName: "", campDate: "", leadDoctor: "", phlebotomist: "", campCoordinator: "" });
      mutate();
    } else {
      alert("Error saving client: " + result.error);
    }
    setSaving(false);
  };

  // CLIENT DELETE FUNCTION
  const handleDeleteClient = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this Client? This will also delete all associated camps and employees!")) {
      try {
        const res = await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE' });
        if (res.ok) {
          mutate();
          alert("Client deleted successfully.");
        } else {
          alert("Cannot delete client. They might have active records.");
        }
      } catch (err) {
        alert("Network error while deleting client.");
      }
    }
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Clients...</div>;

  const clients = data?.clients || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Client Manager</h1>
          <p className="text-gray-500 mt-1">Configure company details, assign HR teams, and set dynamic test checklists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-[#008C8C] mb-4">Register New Client Camp</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Details</h3>
              <div><label className="block text-xs font-bold text-gray-500">Company Name *</label><input required type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ABC Foods Pvt Ltd" /></div>
              <div><label className="block text-xs font-bold text-gray-500">Camp / Project Name *</label><input required type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.campName} onChange={e => setForm({...form, campName: e.target.value})} placeholder="e.g. Annual FSSAI Checkup" /></div>
              <div><label className="block text-xs font-bold text-gray-500">Camp Date *</label><input required type="date" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.campDate} onChange={e => setForm({...form, campDate: e.target.value})} /></div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">On-Site Team</h3>
              <div><label className="block text-xs font-bold text-gray-500">Lead Doctor</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold" value={form.leadDoctor} onChange={e => setForm({...form, leadDoctor: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-bold text-gray-500">Phlebotomist</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold text-sm" value={form.phlebotomist} onChange={e => setForm({...form, phlebotomist: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500">Coordinator</label><input type="text" className="mt-1 w-full border-2 p-2 rounded-md font-semibold text-sm" value={form.campCoordinator} onChange={e => setForm({...form, campCoordinator: e.target.value})} /></div>
              </div>
            </div>

            <div className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Test Package Checklist</h3>
              <p className="text-[10px] text-indigo-600 mb-2 leading-tight">Selected tests will automatically adjust the reception summary and queue interfaces.</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TESTS.map(test => (
                  <label key={test} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded text-[#008C8C] focus:ring-[#008C8C]"
                      checked={selectedTests.includes(test)}
                      onChange={() => toggleTest(test)}
                    />
                    <span>{test}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button type="submit" disabled={saving} className="w-full bg-[#008C8C] text-white py-3 rounded-md font-bold hover:bg-[#006b6b] transition mt-2 shadow-md">
              {saving ? "Creating System..." : "Initialize Camp Workflow"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-[#002642]">Active Client Projects</h2>
          
          {clients.length === 0 ? (
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400 font-bold">
               No clients found. Register your first camp to begin.
             </div>
          ) : (
            clients.map((client: any) => (
              <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-[#008C8C] transition relative group">
                <div className="flex justify-between items-start border-b pb-3 mb-3">
                  <div>
                    <h3 className="text-xl font-black text-[#002642]">{client.name}</h3>
                    <p className="text-sm font-bold text-teal-600 font-mono mt-1">ID: {client.clientCode || "VHC-CL-LEGACY"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                      {client.camps?.length || 0} Camps Recorded
                    </div>
                    {/* NEW PERMANENT DELETE BUTTON */}
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition shadow-sm"
                    >
                      🗑️ Delete Client
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {client.camps?.map((camp: any) => (
                    <div key={camp.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-slate-800">{camp.campName}</p>
                        <p className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
                          {new Date(camp.campDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned Team</p>
                          <p className="text-xs font-semibold text-gray-700">Dr. {camp.leadDoctor || "Pending"}</p>
                          <p className="text-[10px] text-gray-500">Coord: {camp.campCoordinator || "Pending"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase">Active Tests</p>
                          <p className="text-xs font-semibold text-indigo-900 leading-tight">
                            {camp.testChecklist ? camp.testChecklist.replace(/,/g, ", ") : "Standard FSSAI"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}