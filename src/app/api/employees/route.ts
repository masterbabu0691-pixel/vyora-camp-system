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

    // 2. The Master Workflow Engine (Controls the Queues)
    let whereClause: any = {};
    
    if (queue === 'reception') {
      whereClause.status = 'REGISTERED';
    } else if (queue === 'doctor') {
      whereClause.status = 'RECEPTION_DONE';
    } else if (queue === 'phlebotomy') {
      whereClause.status = 'DOC_DONE'; // Picks up exactly where Doctor left off
    } else if (queue === 'laboratory') {
      whereClause.status = 'PHLEBO_DONE'; // Picks up exactly where Phlebotomy left off
    } else if (queue === 'review') {
      whereClause.status = 'LAB_DONE'; // Picks up exactly where Lab left off
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