import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');
  const testType = searchParams.get('type'); // 'xray', 'ecg', 'pft', or 'audio'

  if (!campId || !testType) return NextResponse.json({ success: false });

  // Dynamically determine which status field to check based on the URL
  const statusField = `${testType}Status`;

  try {
    const employees = await prisma.employee.findMany({
      where: { 
        campId, 
        status: { not: 'PRE_REGISTERED' }, // Only show people who passed reception
        [statusField]: { not: 'N/A' } // Don't show if this test wasn't selected for this camp
      },
      select: {
        id: true, name: true, empCode: true, serialNo: true, uhid: true,
        [statusField]: true, [`${testType}File`]: true
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
    const { employeeId, testType, fileData } = await request.json();
    
    const statusField = `${testType}Status`;
    const fileField = `${testType}File`;

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        [statusField]: 'DONE',
        [fileField]: fileData // Saves the base64 image or file URL
      }
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
