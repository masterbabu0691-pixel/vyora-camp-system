import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');

  try {
    // If Admin selects a specific camp, filter by it. Otherwise, show all.
    const filter = campId && campId !== 'all' ? { campId } : {};

    const total = await prisma.employee.count({ where: filter });
    const doctor = await prisma.employee.count({ where: { ...filter, status: { in: ['DOCTOR_PENDING', 'DOCTOR_IN_PROGRESS'] } } });
    const lab = await prisma.employee.count({ where: { ...filter, status: { in: ['LAB_PENDING', 'LAB_IN_PROGRESS'] } } });
    const review = await prisma.employee.count({ where: { ...filter, status: 'FINAL_REVIEW' } });
    const completed = await prisma.employee.count({ where: { ...filter, status: 'COMPLETED' } });

    return NextResponse.json({ total, doctor, lab, review, completed });
  } catch (error) {
    return NextResponse.json({ total: 0, doctor: 0, lab: 0, review: 0, completed: 0 });
  }
}