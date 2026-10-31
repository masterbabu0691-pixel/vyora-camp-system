import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, vitals, examination } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // 1. Save or Update Vitals
    await prisma.vitals.upsert({
      where: { employeeId: employeeId },
      update: { ...vitals },
      create: { employeeId, ...vitals }
    });

    // 2. Save or Update Physical Examination
    await prisma.examination.upsert({
      where: { employeeId: employeeId },
      update: { ...examination },
      create: { employeeId, ...examination }
    });

    // 3. Move employee status forward to trigger the Final Review queue
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'DOC_DONE' } 
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Doctor DB Save Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save clinical data' }, { status: 500 });
  }
}