import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campId, employees } = body;

    if (!campId || !employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid data or empty file provided" }, { status: 400 });
    }

    // --- 1. NEW LOGIC: Fetch the camp to read the active diagnostic checklist ---
    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    const tests = camp?.testChecklist || "";

    // Determine statuses ONCE for the entire batch of patients
    // If the test is checked, it sets "PENDING". If not, it forces "N/A" (Hiding it from the system entirely).
    const xrayStatus = tests.includes("X-Ray") ? "PENDING" : "N/A";
    const ecgStatus = tests.includes("ECG") ? "PENDING" : "N/A";
    const pftStatus = tests.includes("PFT") ? "PENDING" : "N/A";
    const audioStatus = tests.includes("Audiometry") ? "PENDING" : "N/A";

    // 2. Get current employee count to continue serial numbers seamlessly
    const currentCount = await prisma.employee.count({ where: { campId } });
    const currentYear = new Date().getFullYear();

    // 3. Map through Excel rows and generate Sequential Auto-IDs + Dynamic Statuses
    const newEmployeesData = employees.map((emp: any, index: number) => {
      const serialNo = currentCount + index + 1;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      
      return {
        campId: campId,
        serialNo: serialNo,
        uhid: `VYH-${currentYear}-${randomNum}`, 
        empCode: emp.empCode ? String(emp.empCode) : "",
        name: String(emp.name),
        department: emp.department ? String(emp.department) : "",
        designation: emp.designation ? String(emp.designation) : "",
        age: emp.age ? parseInt(emp.age) : null,
        sex: emp.sex ? String(emp.sex).toUpperCase() : null,
        contactNo: emp.contactNo ? String(emp.contactNo) : "",
        
        status: 'PRE_REGISTERED', 

        // --- INJECT DYNAMIC DIAGNOSTIC STATUSES HERE ---
        xrayStatus: xrayStatus,
        ecgStatus: ecgStatus,
        pftStatus: pftStatus,
        audioStatus: audioStatus
      };
    });

    // 4. Bulk insert into Neon PostgreSQL
    const result = await prisma.employee.createMany({
      data: newEmployeesData,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload employees to database." }, { status: 500 });
  }
}