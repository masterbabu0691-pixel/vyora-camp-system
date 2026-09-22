"use client";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LabQueuePage() {
  const { data, isLoading } = useSWR('/api/employees?queue=lab', fetcher, { refreshInterval: 5000 });

  if (isLoading) return <div className="p-8 font-bold text-blue-800 animate-pulse">Loading Lab Queue...</div>;
  const employees = data?.employees || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Laboratory Queue</h1>
          <p className="text-gray-500 mt-1">Patients waiting for blood and urine entry.</p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold">Waiting: {employees.length}</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="p-4 font-semibold">Patient Name</th>
              <th className="p-4 font-semibold">Employee ID</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No patients waiting for lab entry.</td></tr>
            ) : (
              employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-blue-50">
                  <td className="p-4 font-bold text-blue-900">{emp.name}</td>
                  <td className="p-4 text-gray-600">{emp.empCode}</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Lab Pending</span></td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/laboratory/${emp.id}`}>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold shadow hover:bg-blue-700">Enter Results</button>
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