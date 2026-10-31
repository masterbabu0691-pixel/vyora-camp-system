import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Save the Doctor's final conclusion (FIT/UNFIT)
    await prisma.conclusion.upsert({
      where: { employeeId: body.employeeId },
      update: { fitness: body.fitness, remarks: body.remarks },
      create: { employeeId: body.employeeId, fitness: body.fitness, remarks: body.remarks }
    });

    // 2. Mark as COMPLETED and save the Doctor's Diagnostic Remarks
    await prisma.employee.update({
      where: { id: body.employeeId },
      data: { 
        status: 'COMPLETED',
        diagnosticRemarks: body.diagnosticRemarks // <-- Saves the new notes here!
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review Save Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
// Force Vercel Update