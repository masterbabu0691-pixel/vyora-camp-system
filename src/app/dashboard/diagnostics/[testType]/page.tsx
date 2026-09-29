"use client";
import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DiagnosticDesk() {
  const params = useParams();
  const testType = params.testType as string; // 'xray', 'ecg', 'pft', or 'audio'
  
  // Format the title beautifully (e.g., "xray" -> "X-Ray")
  const deskTitles: Record<string, string> = { xray: "X-Ray", ecg: "ECG", pft: "PFT", audio: "Audiometry" };
  const deskName = deskTitles[testType] || testType.toUpperCase();

  const { data: clientData } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [search, setSearch] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Fetch only the queue for THIS specific test
  const { data: queueData, mutate: refreshQueue } = useSWR(
    selectedCampId ? `/api/diagnostics?campId=${selectedCampId}&type=${testType}` : null, fetcher
  );

  const employees = queueData?.employees || [];
  
  const filteredQueue = search ? employees.filter((emp: any) => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    String(emp.serialNo).includes(search) ||
    emp.uhid.toLowerCase().includes(search.toLowerCase())
  ) : employees;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, empId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(empId);

    // Convert file to Base64 for instant saving (or replace with your cloud upload logic)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result;
      
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, testType, fileData: base64Data })
      });

      if (res.ok) refreshQueue();
      else alert("Upload failed.");
      
      setUploadingId(null);
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#002642] uppercase">{deskName} STATION</h1>
          <p className="text-gray-500 mt-1">Select camp, search patient, and upload {deskName} report.</p>
        </div>
      </div>

      <div className="bg-[#002642] p-6 rounded-xl shadow-md text-white">
        <label className="block text-sm font-bold text-teal-300 mb-2 uppercase tracking-wide">1. Select Target Camp</label>
        <select 
          className="w-full p-3 rounded-md text-gray-900 font-bold outline-none cursor-pointer" 
          value={selectedCampId} 
          onChange={(e) => setSelectedCampId(e.target.value)}
        >
          <option value="">-- Choose Client Organization & Camp --</option>
          {clientData?.clients?.map((client: any) => (
            <optgroup key={client.id} label={`🏢 ${client.name}`}>
              {client.camps?.map((camp: any) => (
                <option key={camp.id} value={camp.id}>{camp.campName}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedCampId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <input 
            type="text" 
            placeholder={`🔍 Search ${deskName} Queue by Name, UHID, or Serial No...`} 
            className="w-full p-4 mb-6 rounded-xl border-2 border-[#008C8C] text-lg font-bold outline-none" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-t">
                <th className="p-4">Patient Info</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action / Upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQueue.map((emp: any) => {
                const status = emp[`${testType}Status`];
                const isDone = status === 'DONE';

                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-[#002642] uppercase">{emp.name}</p>
                      <p className="text-xs text-gray-500 font-mono">SR: {emp.serialNo} | UHID: {emp.uhid}</p>
                    </td>
                    <td className="p-4">
                      {isDone ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-black">✓ DONE</span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">PENDING</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isDone ? (
                        <a href={emp[`${testType}File`]} target="_blank" className="text-[#008C8C] text-xs font-bold hover:underline">
                          View Report
                        </a>
                      ) : (
                        <div>
                          <input 
                            type="file" 
                            id={`file-${emp.id}`}
                            className="hidden"
                            accept="image/jpeg, image/png, application/pdf"
                            capture="environment" // THIS LAUNCHES MOBILE CAMERA INSTANTLY
                            onChange={(e) => handleFileUpload(e, emp.id)}
                            disabled={uploadingId === emp.id}
                          />
                          <label 
                            htmlFor={`file-${emp.id}`} 
                            className={`cursor-pointer inline-block px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition ${
                              uploadingId === emp.id ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {uploadingId === emp.id ? "⏳ Uploading..." : "📸 Capture / Upload"}
                          </label>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}