"use client";
import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DiagnosticDesk() {
  const { data: session } = useSession();
  const techName = session?.user?.name || "Technician";

  const params = useParams();
  const testType = params.testType as string; 
  
  const deskTitles: Record<string, string> = { xray: "X-Ray", ecg: "ECG", pft: "PFT", audio: "Audiometry" };
  const deskName = deskTitles[testType] || testType.toUpperCase();

  const { data: clientData } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); 
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // NEW: State for the In-App Report Viewer
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const { data: queueData, mutate: refreshQueue } = useSWR(
    selectedCampId ? `/api/diagnostics?campId=${selectedCampId}&type=${testType}` : null, fetcher
  );

  const employees = queueData?.employees || [];
  
  const filteredQueue = employees.filter((emp: any) => {
    const matchesSearch = search === "" || 
      emp.name.toLowerCase().includes(search.toLowerCase()) || 
      String(emp.serialNo).includes(search) ||
      emp.uhid.toLowerCase().includes(search.toLowerCase());
    
    const status = emp[`${testType}Status`];
    const matchesFilter = filterStatus === "ALL" || status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleMarkArrived = async (empId: string) => {
    setProcessingId(empId);
    const res = await fetch('/api/diagnostics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: empId, testType, action: 'ARRIVE', techName })
    });
    if (res.ok) refreshQueue();
    setProcessingId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, empId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(empId);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result;
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, testType, action: 'UPLOAD', fileData: base64Data })
      });
      if (res.ok) {
        alert("Report successfully uploaded!");
        refreshQueue();
      } else {
        alert("Upload failed. Please try again.");
      }
      setUploadingId(null);
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* IN-APP REPORT VIEWER MODAL */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#002642] p-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold tracking-wider">Report Viewer</h2>
              <button onClick={() => setPreviewFile(null)} className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded font-bold transition">Close ✖</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
              {previewFile.startsWith('data:application/pdf') ? (
                <iframe src={previewFile} className="w-full h-[70vh] rounded border-2 border-gray-300" />
              ) : (
                <img src={previewFile} alt="Medical Report" className="max-w-full max-h-[75vh] object-contain rounded border border-gray-300 shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#002642] uppercase">{deskName} STATION</h1>
          <p className="text-gray-500 mt-1">Operator: <span className="font-bold text-[#008C8C]">{techName}</span></p>
        </div>
      </div>

      <div className="bg-[#002642] p-6 rounded-xl shadow-md text-white">
        <label className="block text-sm font-bold text-teal-300 mb-2 uppercase tracking-wide">Select Target Camp</label>
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
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input 
              type="text" 
              placeholder={`🔍 Search by Name, UHID, or Serial No...`} 
              className="flex-1 p-3 rounded-xl border-2 border-gray-200 font-bold outline-none focus:border-[#008C8C]" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['ALL', 'PENDING', 'ARRIVED', 'DONE'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition ${filterStatus === status ? 'bg-white shadow text-[#008C8C]' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-t">
                  <th className="p-4">Patient Info</th>
                  <th className="p-4">Status & Operator</th>
                  <th className="p-4 text-right">Station Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQueue.map((emp: any) => {
                  const status = emp[`${testType}Status`];
                  const tech = emp[`${testType}Tech`];
                  const reportFile = emp[`${testType}File`];

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-[#002642] uppercase">{emp.name}</p>
                        <p className="text-xs text-gray-500 font-mono">SR: {emp.serialNo} | UHID: {emp.uhid}</p>
                      </td>
                      <td className="p-4">
                        {status === 'DONE' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-black">✓ DONE</span>}
                        {status === 'ARRIVED' && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-black">⏳ ARRIVED</span>}
                        {status === 'PENDING' && <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded text-xs font-bold">PENDING</span>}
                        
                        {tech && <p className="text-[10px] text-gray-400 font-semibold mt-1">By: {tech}</p>}
                      </td>
                      <td className="p-4 text-right">
                        
                        {/* STATE 1: PENDING -> MARK ARRIVED */}
                        {status === 'PENDING' && (
                          <button 
                            onClick={() => handleMarkArrived(emp.id)}
                            disabled={processingId === emp.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            {processingId === emp.id ? "Processing..." : "👋 Mark Arrived"}
                          </button>
                        )}

                        {/* STATE 2: ARRIVED -> SPLIT UPLOAD OPTIONS (CAMERA VS FILE) */}
                        {status === 'ARRIVED' && (
                          <div className="flex justify-end gap-2">
                            {/* Camera Button */}
                            <div>
                              <input 
                                type="file" 
                                id={`cam-${emp.id}`}
                                accept="image/*"
                                capture="environment" 
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, emp.id)}
                                disabled={uploadingId === emp.id}
                              />
                              <label htmlFor={`cam-${emp.id}`} className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition inline-block ${uploadingId === emp.id ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                📸 Camera
                              </label>
                            </div>

                            {/* Gallery / PDF Button */}
                            <div>
                              <input 
                                type="file" 
                                id={`gal-${emp.id}`}
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, emp.id)}
                                disabled={uploadingId === emp.id}
                              />
                              <label htmlFor={`gal-${emp.id}`} className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition inline-block ${uploadingId === emp.id ? 'bg-gray-400' : 'bg-gray-700 hover:bg-gray-800'}`}>
                                📁 File
                              </label>
                            </div>
                          </div>
                        )}

                        {/* STATE 3: DONE -> VIEW & REPLACE OPTIONS */}
                        {status === 'DONE' && (
                          <div className="flex justify-end gap-3 items-center">
                            
                            <button 
                              onClick={() => setPreviewFile(reportFile)}
                              className="text-[#008C8C] bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 font-bold text-xs hover:bg-teal-100 transition shadow-sm"
                            >
                              👁️ View Report
                            </button>

                            <div>
                              <input 
                                type="file" 
                                id={`rep-${emp.id}`}
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, emp.id)}
                                disabled={uploadingId === emp.id}
                              />
                              <label htmlFor={`rep-${emp.id}`} className="cursor-pointer text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 font-bold text-xs hover:bg-amber-100 transition shadow-sm inline-block">
                                {uploadingId === emp.id ? "⏳..." : "🔄 Replace"}
                              </label>
                            </div>

                          </div>
                        )}

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}