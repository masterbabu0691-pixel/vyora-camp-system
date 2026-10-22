"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BulkVisionPrintPage() {
  const { data: clientData, isLoading: clientsLoading } = useSWR('/api/clients', fetcher);
  const [selectedCampId, setSelectedCampId] = useState<string>("");

  // Fetch all employees for the selected camp
  const { data: employeeData, isLoading: employeesLoading } = useSWR(
    selectedCampId ? `/api/employees?campId=${selectedCampId}&queue=review` : null, 
    fetcher
  );

  const clients = clientData?.clients || [];
  const employees = employeeData?.employees || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 bg-gray-50 p-4 min-h-screen">
      
      {/* UI Controls (Hidden on Print) */}
      <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#002642]">Bulk Vision Certificates</h1>
          <p className="text-gray-500 text-sm mt-1">Generate multi-page ophthalmologist reports for an entire camp.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            className="border-2 border-gray-200 p-2.5 rounded-lg font-bold outline-none focus:border-[#008C8C] text-[#002642] min-w-[250px]"
            value={selectedCampId}
            onChange={(e) => setSelectedCampId(e.target.value)}
          >
            <option value="">-- Select a Camp --</option>
            {clients.map((client: any) => 
              client.camps?.map((camp: any) => (
                <option key={camp.id} value={camp.id}>
                  {client.name} - {camp.campName}
                </option>
              ))
            )}
          </select>

          <button 
            onClick={() => window.print()} 
            disabled={!selectedCampId || employees.length === 0}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            🖨️ Print {employees.length} Certificates
          </button>
        </div>
      </div>

      {!selectedCampId && (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300 print:hidden text-gray-400 font-bold">
          Please select a camp to load the vision reports.
        </div>
      )}

      {employeesLoading && (
        <div className="p-8 font-bold animate-pulse text-[#002642] text-center print:hidden">Loading Camp Data...</div>
      )}

      {selectedCampId && employees.length === 0 && !employeesLoading && (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-red-300 print:hidden text-red-500 font-bold">
          No processed patients found for this camp.
        </div>
      )}

      {/* --- STRICT GLOBAL PRINT CSS FOR EXACT 1-PAGE FIT --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #bulk-print-container, #bulk-print-container * { visibility: visible; }
          #bulk-print-container { 
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white;
          }
          .a4-print-page {
            width: 210mm; 
            height: 297mm;
            padding-top: 4.5cm; 
            padding-bottom: 2cm; 
            padding-left: 1.5cm; 
            padding-right: 1.5cm;
            box-sizing: border-box;
            page-break-after: always;
            page-break-inside: avoid;
            background: white;
            overflow: hidden; /* Prevents 1 extra pixel from creating a blank page */
            display: flex;
            flex-direction: column;
          }
          .a4-print-page:last-child { page-break-after: auto; }
        }
      `}} />

      {/* --- BULK PRINT CONTAINER --- */}
      <div id="bulk-print-container" className="space-y-8 print:space-y-0">
        {employees.map((emp: any) => {
          
          const exactCampDate = emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
          const rightEye = emp.examination?.eyeRight || "";
          const leftEye = emp.examination?.eyeLeft || "";
          const colorBlindness = emp.examination?.colorBlindness || "Normal";

          return (
            <div key={emp.id} className="a4-print-page bg-white p-6 shadow-sm border print:shadow-none print:border-none print:p-0 text-black mx-auto max-w-4xl">
              
              <div className="flex justify-end mb-3">
                <h2 className="text-lg font-bold text-black uppercase tracking-wide border-b border-black pb-0.5 inline-block">
                  EYE CHECK UP
                </h2>
              </div>

              {/* Patient Demographics Box (Tightened) */}
              <div className="border border-black p-2.5 mb-4 text-[13px] leading-snug">
                <div className="flex flex-wrap gap-x-8 gap-y-1.5 mb-1.5 border-b border-gray-300 pb-1.5">
                  <div className="flex-1 min-w-[250px]">
                    <span className="font-semibold">Name of Patient :</span> <span className="font-bold border-b border-black px-4">{emp.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold">UHID No.:</span> <span className="font-bold border-b border-black px-4">{emp.uhid}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-1.5 mb-1.5 border-b border-gray-300 pb-1.5">
                  <div className="flex-1 min-w-[200px]">
                    <span className="font-semibold">Company / Client :</span> <span className="font-bold border-b border-black px-4 uppercase">{emp.camp?.client?.name || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Age:</span> <span className="font-bold border-b border-black px-2">{emp.age || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Sex:</span> <span className="font-bold border-b border-black px-2">{emp.sex || "-"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-1.5 mb-1.5">
                  <div className="flex-1 min-w-[250px]">
                    <span className="font-semibold">Attending Consultant :</span> <span className="border-b border-black px-16 inline-block"></span>
                  </div>
                  <div>
                    <span className="font-semibold">Date :</span> <span className="font-bold border-b border-black px-4">{exactCampDate}</span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="font-semibold">Chief Complaints :</span> <span className="border-b border-black px-16 inline-block w-[70%]"></span>
                </div>
              </div>

              {/* Vision Data (Tightened) */}
              <div className="mb-4 text-[13px] flex-1">
                <h3 className="font-bold mb-1.5">Examination of Eye :</h3>
                <p className="font-semibold ml-4 mb-1.5">1. Vision :</p>
                
                <div className="ml-8 mb-3">
                  <table className="w-[85%] border-collapse border border-black text-center text-[13px]">
                    <thead>
                      <tr>
                        <th className="border border-black p-1 w-1/2">Visual</th>
                        <th className="border border-black p-1 w-1/4">Right</th>
                        <th className="border border-black p-1 w-1/4">Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 text-left pl-2">With Glasses ( Corrected Vision )</td>
                        <td className="border border-black p-1 h-6"></td>
                        <td className="border border-black p-1 h-6"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 text-left pl-2">Without Glasses ( Uncorrected Vision )</td>
                        <td className="border border-black p-1 font-bold h-6">{rightEye}</td>
                        <td className="border border-black p-1 font-bold h-6">{leftEye}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="ml-8 mb-4">
                  <table className="w-[85%] border-collapse border border-black text-center text-[13px]">
                    <thead>
                      <tr>
                        <th className="border border-black p-1 w-[10%]"></th>
                        <th className="border border-black p-1 w-[20%]"></th>
                        <th className="border border-black p-1">Sph.</th>
                        <th className="border border-black p-1">Cyl</th>
                        <th className="border border-black p-1">Axis</th>
                        <th className="border border-black p-1">Vn</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-0.5 font-semibold" rowSpan={2}>RE</td>
                        <td className="border border-black p-0.5 text-left pl-2">Distance</td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-0.5 text-left pl-2">Near</td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-0.5 font-semibold" rowSpan={2}>LE</td>
                        <td className="border border-black p-0.5 text-left pl-2">Distance</td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-0.5 text-left pl-2">Near</td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                        <td className="border border-black p-0.5 h-5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="ml-4 space-y-3">
                  <div>
                    <p className="font-semibold mb-1">2. SLE (Slit lamp examinations)</p>
                    <div className="ml-6 space-y-0.5">
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
                  
                  <p className="font-semibold">
                    6. Color Vision <span className="ml-6">:</span> 
                    <span className="font-normal border-b border-black px-4 ml-2">{colorBlindness}</span>
                  </p>
                  
                  <p className="font-semibold pt-1">7. Remark <span className="ml-11">:</span></p>
                  <p className="font-semibold pt-2">Clinical Advice :</p>
                </div>
              </div>

              {/* Footer pushes to the very bottom of the page */}
              <div className="mt-auto flex justify-between items-end pb-2">
                <div className="text-center">
                  <p className="font-bold text-[14px]">Ophthalmologist</p>
                  <p className="text-[13px]">MS (Opthal)</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}