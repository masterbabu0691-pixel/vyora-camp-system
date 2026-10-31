import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');
  const testType = searchParams.get('type');

  if (!campId || !testType) return NextResponse.json({ success: false });

  const statusField = `${testType}Status`;

  try {
    const employees = await prisma.employee.findMany({
      where: { 
        campId, 
        status: { not: 'PRE_REGISTERED' }, 
        [statusField]: { not: 'N/A' } 
      },
      select: {
        id: true, name: true, empCode: true, serialNo: true, uhid: true,
        [statusField]: true, [`${testType}File`]: true, [`${testType}Tech`]: true
      },
      orderBy: { serialNo: 'asc' }
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, testType, action, fileData, techName } = await request.json();
    
    const statusField = `${testType}Status`;
    const techField = `${testType}Tech`;
    const fileField = `${testType}File`;

    // ACTION 1: Mark as Arrived & Assign Technician
    if (action === 'ARRIVE') {
      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          [statusField]: 'ARRIVED',
          [techField]: techName || "Unknown Technician"
        }
      });
      return NextResponse.json({ success: true, employee: updated });
    }

    // ACTION 2: Upload Report & Mark as Done
    if (action === 'UPLOAD') {
      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          [statusField]: 'DONE',
          [fileField]: fileData
        }
      });
      return NextResponse.json({ success: true, employee: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}