"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReviewPage() {
  const { data: apiData, mutate } = useSWR('/api/employees?queue=review', fetcher);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleComplete = async () => {
    if (!selectedEmp) return;
    await fetch(`/api/employees`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedEmp.id, status: 'COMPLETED' })
    });
    setSelectedEmp(null);
    mutate();
  };

  const employees = apiData?.employees || [];

  return (
    <div className="max-w-6xl mx-auto flex gap-8 print:block print:m-0 print:p-0 print:w-full print:max-w-none">
      
      {/* LEFT SIDE: Queue (Hidden when printing) */}
      <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#002642] mb-4">Final Review Queue</h2>
        {employees.length === 0 ? <p className="text-gray-500 text-sm">No reports pending review.</p> : (
          <ul className="divide-y divide-gray-100">
            {employees.map((emp: any) => (
              <li 
                key={emp.id} 
                className={`p-4 cursor-pointer hover:bg-teal-50 transition ${selectedEmp?.id === emp.id ? 'bg-teal-100 border-l-4 border-teal-600' : ''}`}
                onClick={() => setSelectedEmp(emp)}
              >
                <div className="font-bold text-[#002642]">{emp.name}</div>
                <div className="text-xs text-gray-500 mt-1">Code: {emp.empCode || "N/A"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RIGHT SIDE: A4 FSSAI Certificate Preview */}
      <div className="w-2/3 print:w-full">
        {selectedEmp ? (
          <div>
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h2 className="text-xl font-bold text-[#002642]">Certificate Preview</h2>
              <div className="space-x-4">
                <button onClick={handlePrint} className="bg-gray-800 text-white px-6 py-2 rounded-md font-bold hover:bg-black transition">🖨 Print Report</button>
                <button onClick={handleComplete} className="bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 transition">✓ Mark as Completed</button>
              </div>
            </div>

            {/* THE ACTUAL PRINTABLE PAGE */}
            <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 print:pt-[4cm] w-full max-w-[21cm] min-h-[27.7cm] mx-auto text-black">
              
              <h1 className="text-center text-2xl font-black underline mb-6 uppercase">Medical Fitness Certificate for Food Handlers</h1>
              <p className="text-center text-sm font-bold mb-8">(As per FSSAI Guidelines)</p>

              <div className="space-y-4 text-sm leading-loose">
                <p>This is to certify that I have personally examined <strong>Mr./Ms. {selectedEmp.name}</strong>,</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Age/Sex:</strong> {selectedEmp.age} / {selectedEmp.sex}</p>
                  <p><strong>Employee Code:</strong> {selectedEmp.empCode || "N/A"}</p>
                  <p><strong>Department:</strong> {selectedEmp.department || "N/A"}</p>
                  {/* DESIGNATION ADDED HERE */}
                  <p><strong>Designation:</strong> {selectedEmp.designation || "N/A"}</p>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="font-bold underline mb-2">Vitals</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <p>Height: {selectedEmp.vitals?.height} cm</p>
                    <p>Weight: {selectedEmp.vitals?.weight} kg</p>
                    <p>BMI: {selectedEmp.vitals?.bmi}</p>
                  </div>
                </div>

                <p className="mt-6">
                  Based on the medical examination and laboratory investigations, it is certified that he/she is free from any infectious or communicable diseases and is <strong>FIT</strong> to work as a food handler.
                </p>

                <div className="mt-20 flex justify-between">
                  <div className="text-center">
                    <p>_______________________</p>
                    <p className="font-bold mt-1">Employee Signature</p>
                  </div>
                  <div className="text-center">
                    <p>_______________________</p>
                    <p className="font-bold mt-1">Medical Officer</p>
                    <p className="text-xs">Vyora Healthcare Pvt. Ltd.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-[80vh] text-gray-400 font-bold print:hidden">
            Select a patient from the queue to review and print their FSSAI certificate.
          </div>
        )}
      </div>
    </div>
  );
}