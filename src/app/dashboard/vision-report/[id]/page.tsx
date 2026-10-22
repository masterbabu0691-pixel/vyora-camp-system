"use client";
import { use } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OphthalmologistReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  
  const { data, isLoading } = useSWR(`/api/employees?id=${employeeId}`, fetcher);

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Vision Report...</div>;

  const emp = data?.employee;
  if (!emp) return <div className="p-8 font-bold text-red-500">Patient not found.</div>;

  const exactCampDate = emp.camp?.campDate ? new Date(emp.camp.campDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  
  // Existing data from basic checkup
  const rightEye = emp.examination?.eyeRight || "";
  const leftEye = emp.examination?.eyeLeft || "";
  const colorBlindness = emp.examination?.colorBlindness || "Normal";

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-gray-50 p-4 min-h-screen">
      
      {/* UI Controls (Hidden on Print) */}
      <div className="bg-white p-6 rounded-xl shadow-md border flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#002642]">Eye Check Up Report</h1>
          <p className="text-gray-500 text-sm mt-1">Clinical format for {emp.name}</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-black transition flex items-center gap-2"
        >
          🖨️ Print Eye Check Up
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #vision-printable-report, #vision-printable-report * { visibility: visible; }
          #vision-printable-report {
            position: absolute; left: 0; top: 0; width: 210mm; height: 297mm;
            /* Top margin left blank for your pre-printed letterhead */
            padding-top: 4.5cm; padding-bottom: 2cm; padding-left: 1.5cm; padding-right: 1.5cm;
            background: white; box-sizing: border-box; margin: 0;
          }
        }
      `}} />

      {/* --- A4 PRINTABLE CLINICAL EYE REPORT BELOW --- */}
      <div id="vision-printable-report" className="bg-white p-8 shadow-sm border print:shadow-none print:border-none print:p-0 text-black">
        
        {/* Header Title matching the reference */}
        <div className="flex justify-end mb-4">
          <h2 className="text-lg font-bold text-black uppercase tracking-wide border-b border-black pb-1 inline-block">
            EYE CHECK UP
          </h2>
        </div>

        {/* Patient Demographics Box */}
        <div className="border border-black p-3 mb-6 text-[13px] leading-relaxed">
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2 border-b border-gray-300 pb-2">
            <div className="flex-1 min-w-[250px]">
              <span className="font-semibold">Name of Patient :</span> <span className="font-bold border-b border-black px-4">{emp?.name}</span>
            </div>
            <div>
              <span className="font-semibold">UHID No.:</span> <span className="font-bold border-b border-black px-4">{emp?.uhid}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2 border-b border-gray-300 pb-2">
            <div className="flex-1 min-w-[200px]">
              <span className="font-semibold">Company / Client :</span> <span className="font-bold border-b border-black px-4 uppercase">{emp?.camp?.client?.name || "-"}</span>
            </div>
            <div>
              <span className="font-semibold">Age:</span> <span className="font-bold border-b border-black px-2">{emp?.age || "-"}</span>
            </div>
            <div>
              <span className="font-semibold">Sex:</span> <span className="font-bold border-b border-black px-2">{emp?.sex || "-"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2">
            <div className="flex-1 min-w-[250px]">
              <span className="font-semibold">Attending Consultant :</span> <span className="border-b border-black px-16 inline-block"></span>
            </div>
            <div>
              <span className="font-semibold">Date :</span> <span className="font-bold border-b border-black px-4">{exactCampDate}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <span className="font-semibold">Chief Complaints :</span> <span className="border-b border-black px-16 inline-block w-[70%]"></span>
          </div>
        </div>

        {/* 1. Vision Section */}
        <div className="mb-6 text-[13px]">
          <h3 className="font-bold mb-2">Examination of Eye :</h3>
          <p className="font-semibold ml-4 mb-2">1. Vision :</p>
          
          <div className="ml-8 mb-4">
            <table className="w-[85%] border-collapse border border-black text-center text-[13px]">
              <thead>
                <tr>
                  <th className="border border-black p-1.5 w-1/2">Visual</th>
                  <th className="border border-black p-1.5 w-1/4">Right</th>
                  <th className="border border-black p-1.5 w-1/4">Left</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 text-left pl-2">With Glasses ( Corrected Vision )</td>
                  <td className="border border-black p-1.5 h-7"></td>
                  <td className="border border-black p-1.5 h-7"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-left pl-2">Without Glasses ( Uncorrected Vision )</td>
                  <td className="border border-black p-1.5 font-bold h-7">{rightEye}</td>
                  <td className="border border-black p-1.5 font-bold h-7">{leftEye}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Refraction Grid */}
          <div className="ml-8 mb-6">
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
                  <td className="border border-black p-1 font-semibold" rowSpan={2}>RE</td>
                  <td className="border border-black p-1 text-left pl-2">Distance</td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left pl-2">Near</td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-semibold" rowSpan={2}>LE</td>
                  <td className="border border-black p-1 text-left pl-2">Distance</td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left pl-2">Near</td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clinical List matching the reference exactly */}
          <div className="ml-4 space-y-4">
            <div>
              <p className="font-semibold mb-1">2. SLE (Slit lamp examinations)</p>
              <div className="ml-6 space-y-1">
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
            
            <p className="font-semibold pt-2">7. Remark <span className="ml-11">:</span></p>
            
            <p className="font-semibold pt-4">Clinical Advice :</p>
          </div>
        </div>

        {/* Footer Signature Block */}
        <div className="mt-20 flex justify-between items-end pb-8">
          <div className="text-center">
            <p className="font-bold text-[14px]">Ophthalmologist</p>
            <p className="text-[13px]">MS (Opthal)</p>
          </div>
          <div className="text-center">
             {/* Space left blank for actual candidate signature if needed, or doctor's sign matching the image */}
          </div>
        </div>

      </div>
    </div>
  );
}