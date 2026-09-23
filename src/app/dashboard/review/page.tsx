"use client";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReviewQueuePage() {
  const { data, isLoading } = useSWR('/api/employees?queue=review', fetcher, { refreshInterval: 5000 });

  if (isLoading) return <div className="p-8 font-bold animate-pulse text-[#002642]">Loading Final Review Queue...</div>;
  const employees = data?.employees || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Final Review & Sign-Off Queue</h1>
          <p className="text-gray-500 mt-1">Select a patient to evaluate clinical data and generate the final medical report.</p>
        </div>
        <div className="bg-[#002642] text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2">
          <span>Pending Reviews:</span>
          <span className="text-[#008C8C] text-lg">{employees.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-[#002642] text-sm">Patients Awaiting Doctor Sign-Off</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name & Details</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiers</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Client / Company</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500 font-semibold">No patients waiting for final review.</td></tr>
            ) : (
              employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-teal-50/30 transition">
                  <td className="p-4">
                    <p className="font-bold text-[#002642] uppercase">{emp.name}</p>
                    <p className="text-xs text-gray-500">
                      {emp.age ? `${emp.age} Yrs` : "-"} / {emp.sex || "-"} | {emp.designation || "-"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-xs font-bold text-[#008C8C]">{emp.uhid}</p>
                    <p className="font-mono text-[11px] text-gray-400">SR: {emp.serialNo} | Code: {emp.empCode || "-"}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="font-semibold text-gray-800 text-sm">{emp.camp?.client?.name || "-"}</p>
                    <p className="text-xs text-gray-500">{emp.camp?.campName || "-"}</p>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/review/${emp.id}`}>
                      <button className="bg-[#008C8C] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-teal-600 transition inline-flex items-center gap-2">
                        <span>Review & Generate</span>
                        <span className="text-lg">📄</span>
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}