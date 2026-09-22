"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientManagerPage() {
  const { data, mutate, isLoading } = useSWR('/api/clients', fetcher);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "", clientCode: "", campName: "", campDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ name: "", clientCode: "", campName: "", campDate: "" });
      mutate(); // Instantly refresh the list below
    } else {
      alert("Failed to save client.");
    }
    setSaving(false);
  };

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Clients...</div>;
  const clients = data?.clients || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Client & Camp Manager</h1>
          <p className="text-gray-500 mt-1">Register new corporate clients and schedule camp dates.</p>
        </div>
      </div>

      {/* New Client Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#008C8C] mb-6">Schedule New Camp</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700">Company Name</label>
            <input required type="text" placeholder="e.g. XYZ Manufacturing" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Client Code (Short ID)</label>
            <input required type="text" placeholder="e.g. XYZ-MFG" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold uppercase" value={form.clientCode} onChange={e => setForm({...form, clientCode: e.target.value.toUpperCase()})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Camp Title / Type</label>
            <input required type="text" placeholder="e.g. Annual FSSAI Checkup 2026" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold" value={form.campName} onChange={e => setForm({...form, campName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Camp Date</label>
            <input required type="date" className="mt-1 w-full border-2 border-gray-200 p-3 rounded-md font-semibold text-gray-700" value={form.campDate} onChange={e => setForm({...form, campDate: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-[#002642] text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-[#003865] transition shadow-md disabled:opacity-50">
          {saving ? "Saving..." : "+ Register Client & Camp"}
        </button>
      </form>

      {/* List of Existing Clients */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#002642]">Registered Clients</h2>
        {clients.map((client: any) => (
          <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-[#002642]">{client.name} <span className="text-sm font-bold text-gray-400 ml-2">({client.clientCode})</span></h3>
              <div className="mt-2 space-y-1">
                {client.camps.map((camp: any) => (
                  <p key={camp.id} className="text-sm font-semibold text-[#008C8C]">
                    📅 {new Date(camp.campDate).toLocaleDateString('en-GB')} — {camp.campName}
                  </p>
                ))}
              </div>
            </div>
            {/* We will add the "Pre-Register Employees" button here in the next step! */}
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-md font-bold text-sm cursor-not-allowed">
              Pre-Registration Tool (Coming Next)
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}