import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Save the Doctor's final conclusion
    await prisma.conclusion.upsert({
      where: { employeeId: body.employeeId },
      update: { fitness: body.fitness, remarks: body.remarks },
      create: { employeeId: body.employeeId, fitness: body.fitness, remarks: body.remarks }
    });

    // Mark the patient workflow as entirely COMPLETED
    await prisma.employee.update({
      where: { id: body.employeeId },
      data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review Save Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}