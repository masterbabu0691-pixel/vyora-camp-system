import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');

  try {
    if (!campId) return NextResponse.json({ success: false, data: [] });

    // Fetch everyone from this specific camp, including ALL their medical data
    const data = await prisma.employee.findMany({
      where: { campId: campId },
      include: { 
        vitals: true, 
        examination: true, 
        labResults: true 
      },
      orderBy: { serialNo: 'asc' }
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}