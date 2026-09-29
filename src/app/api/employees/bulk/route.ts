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

    // 1. Get current employee count to continue serial numbers seamlessly
    const currentCount = await prisma.employee.count({ where: { campId } });
    const currentYear = new Date().getFullYear();

    // 2. Map through Excel rows and generate Sequential Auto-IDs
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
        
        // FIXED: Set to PRE_REGISTERED so they show up on your current roster screen!
        status: 'PRE_REGISTERED' 
      };
    });

    // 3. Bulk insert into Neon PostgreSQL
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