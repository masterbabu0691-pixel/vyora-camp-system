import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { employeeId, newCampId } = await request.json();

    if (!employeeId || !newCampId) {
      return NextResponse.json({ error: "Employee ID and Target Camp ID are required." }, { status: 400 });
    }

    // Reassign the camp. Because all clinical relations (vitals, exams, labs, conclusion) 
    // link directly to the employee ID, 100% of their data is preserved!
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { campId: newCampId },
      include: { camp: { include: { client: true } } }
    });

    return NextResponse.json({ success: true, employee: updatedEmployee, message: "Employee successfully reassigned!" });
  } catch (error: any) {
    console.error("Camp Reassignment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}