import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

// 1. READ EMPLOYEES (Your existing GET function)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queue = searchParams.get('queue');
  const id = searchParams.get('id');
  const campId = searchParams.get('campId');

  try {
    if (id) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { camp: { include: { client: true } }, vitals: true, examination: true, labResults: true, conclusion: true }
      });
      return NextResponse.json({ employee });
    }

    let whereClause: any = {};
    
    if (queue === 'reception') {
      whereClause.status = 'REGISTERED';
    } else if (queue === 'doctor') {
      whereClause.status = { in: ['RECEPTION_DONE', 'DOCTOR_PENDING'] }; 
    } else if (queue === 'phlebotomy') {
      whereClause.status = 'DOC_DONE'; 
    } else if (queue === 'laboratory') {
      whereClause.status = 'LAB_PENDING'; 
    } else if (queue === 'review') {
      whereClause.status = 'LAB_DONE'; 
    }

    if (campId) whereClause.campId = campId;

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: { 
        camp: { include: { client: true } },
        vitals: true,
        examination: true,
        labResults: true,
        conclusion: true
      },
      orderBy: { serialNo: 'asc' }
    });
    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. CREATE / SAVE MANUAL EMPLOYEE (The missing POST function with Diagnostic Fix)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, campId, name, uhid, serialNo, age, sex, department, empCode, contactNo } = body;

    if (!campId || !name) {
      return NextResponse.json({ error: 'Camp ID and Name are required' }, { status: 400 });
    }

    // Fetch the camp to see which diagnostics are active for this specific client
    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 });

    // Dynamically assign PENDING or N/A based on camp configuration
    const xrayStatus = camp.xrayActive ? "PENDING" : "N/A";
    const ecgStatus = camp.ecgActive ? "PENDING" : "N/A";
    const pftStatus = camp.pftActive ? "PENDING" : "N/A";
    const audioStatus = camp.audioActive ? "PENDING" : "N/A";

    if (id) {
      // If ID exists, we are UPDATING an existing manual pre-registration
      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: {
          name, uhid, serialNo: serialNo ? Number(serialNo) : null, 
          age: age ? String(age) : null, sex, department, empCode, contactNo
        }
      });
      return NextResponse.json({ success: true, employee: updatedEmployee });
    } else {
      // If no ID exists, we are CREATING a brand new manual pre-registration
      const newEmployee = await prisma.employee.create({
        data: {
          campId, name, uhid: uhid || `MANUAL-${Date.now()}`, 
          serialNo: serialNo ? Number(serialNo) : null, 
          age: age ? String(age) : null, sex, department, empCode, contactNo,
          status: 'REGISTERED',
          xrayStatus,  // Safe dynamic diagnostic injections
          ecgStatus,
          pftStatus,
          audioStatus
        }
      });
      return NextResponse.json({ success: true, employee: newEmployee });
    }
  } catch (error: any) {
    console.error("Manual Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE EMPLOYEE (Your existing DELETE function)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

  try {
    await prisma.labResult.deleteMany({ where: { employeeId: id } });
    await prisma.vitals.deleteMany({ where: { employeeId: id } });
    await prisma.examination.deleteMany({ where: { employeeId: id } });
    await prisma.conclusion.deleteMany({ where: { employeeId: id } });
    
    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}