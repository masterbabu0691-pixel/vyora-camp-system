import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queue = searchParams.get('queue');
  const id = searchParams.get('id');
  const campId = searchParams.get('campId');

  try {
    // 1. Fetch Single Employee Data (Used by Doctor/Lab/Review UI)
    if (id) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { camp: { include: { client: true } }, vitals: true, examination: true, labResults: true, conclusion: true }
      });
      return NextResponse.json({ employee });
    }

    // 2. THE STRICT PIPELINE ROUTER
    let whereClause: any = {};
    
    if (queue === 'reception') {
      whereClause.status = 'REGISTERED'; // Step 1: New Uploads
    } else if (queue === 'doctor') {
      whereClause.status = 'RECEPTION_DONE'; // Step 2: Cleared by Reception
    } else if (queue === 'phlebotomy') {
      whereClause.status = 'DOC_DONE'; // Step 3: Examined by Doctor
    } else if (queue === 'laboratory') {
      whereClause.status = 'LAB_PENDING'; // Step 4: Samples Collected by Phlebo
    } else if (queue === 'review') {
      whereClause.status = 'LAB_DONE'; // Step 5: Tests complete, ready for Final Report
    }

    if (campId) whereClause.campId = campId;

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: { camp: { include: { client: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

  try {
    // Delete related records first to avoid foreign key constraints, then delete employee
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