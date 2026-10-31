import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');

  try {
    if (!campId) return NextResponse.json({ success: false, employees: [] });

    // Fetch everyone from this specific camp, including ALL their medical data, conclusions, and client details
    const employees = await prisma.employee.findMany({
      where: { campId: campId },
      include: { 
        vitals: true, 
        examination: true, 
        labResults: true,
        conclusion: true,
        camp: { include: { client: true } }
      },
      orderBy: { serialNo: 'asc' }
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}