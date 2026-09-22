import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campId, employees } = body;

    if (!campId || !employees || !Array.isArray(employees)) {
      return NextResponse.json({ success: false, error: "Invalid data provided" }, { status: 400 });
    }

    // 1. Get the current employee count to continue serial numbers seamlessly
    const currentCount = await prisma.employee.count({ where: { campId } });
    const currentYear = new Date().getFullYear();

    // 2. Map through the Excel rows and generate Auto-IDs for each person
    const newEmployeesData = employees.map((emp: any, index: number) => {
      const serialNo = currentCount + index + 1;
      const uhid = `UHID-${currentYear}-${String(serialNo).padStart(4, "0")}`;
      const certificateNo = `VHC/${currentYear}/CERT/${String(serialNo).padStart(4, "0")}`;

      return {
        campId: campId,
        serialNo: serialNo,
        uhid: uhid,
        certificateNo: certificateNo,
        empCode: emp.empCode ? String(emp.empCode) : "",
        name: String(emp.name),
        department: emp.department ? String(emp.department) : "",
        designation: emp.designation ? String(emp.designation) : "",
        age: emp.age ? parseInt(emp.age) : null,
        sex: emp.sex ? String(emp.sex) : null,
        contactNo: emp.contactNo ? String(emp.contactNo) : "",
        status: 'PRE_REGISTERED'
      };
    });

    // 3. Bulk insert into Neon PostgreSQL in one single transaction
    const result = await prisma.employee.createMany({
      data: newEmployeesData,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload employees" }, { status: 500 });
  }
}