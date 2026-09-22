"use client";

import useSWR from "swr";
import Link from "next/link";

// This tells the page how to fetch the data
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DoctorQueuePage() {
  // SWR automatically checks the database every 5 seconds (5000 milliseconds) for new patients
  const { data, error, isLoading } = useSWR('/api/employees?queue=doctor', fetcher, { 
    refreshInterval: 5000 
  });

  if (isLoading) return <div className="p-8 text-xl font-bold text-[#002642] animate-pulse">Loading Doctor Queue...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold">Error loading queue. Please check connection.</div>;

  const employees = data?.employees || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002642]">Doctor Queue</h1>
          <p className="text-gray-500 mt-1">Patients waiting for medical examination.</p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold">
          Waiting: {employees.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#002642] text-white">
              <th className="p-4 font-semibold text-sm">Patient Details</th>
              <th className="p-4 font-semibold text-sm">Vitals summary</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">
                  No patients currently waiting in the queue.
                </td>
              </tr>
            ) : (
              employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-[#002642] text-lg">{emp.name}</p>
                    <p className="text-sm text-gray-500">ID: {emp.empCode} | {emp.age} Yrs, {emp.sex}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-gray-700">BMI: <span className={emp.vitals?.bmi > 25 ? "text-amber-600" : "text-green-600"}>{emp.vitals?.bmi}</span></p>
                    <p className="text-xs text-gray-500">{emp.vitals?.height} cm / {emp.vitals?.weight} kg</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Waiting
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/doctor/${emp.id}`}>
                      <button className="bg-[#008C8C] text-white px-6 py-2 rounded-md font-bold shadow hover:bg-[#006b6b] transition">
                        Examine
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