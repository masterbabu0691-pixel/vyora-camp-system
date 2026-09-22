import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');
  
  try {
    if (!campId) return NextResponse.json({ success: false, message: "No camp ID provided" });
    const employees = await prisma.employee.findMany({
      where: { campId: campId, status: 'PRE_REGISTERED' },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Calculate sequential Serial Number for this specific camp
    const campEmployeeCount = await prisma.employee.count({
      where: { campId: body.campId }
    });
    const serialNo = campEmployeeCount + 1;
    
    // 2. Generate professional sequential IDs
    const currentYear = new Date().getFullYear();
    const uhid = `UHID-${currentYear}-${String(serialNo).padStart(4, "0")}`;
    const certificateNo = `VHC/${currentYear}/CERT/${String(serialNo).padStart(4, "0")}`;
    
    const newEmployee = await prisma.employee.create({
      data: {
        campId: body.campId,
        serialNo: serialNo, 
        uhid: uhid,
        certificateNo: certificateNo,
        empCode: body.empCode || "",
        name: body.name,
        department: body.department || "",
        designation: body.designation || "",
        age: body.age ? parseInt(body.age) : null,
        sex: body.sex || null,
        contactNo: body.contactNo || "",
        status: 'PRE_REGISTERED'
      }
    });
    
    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error("Pre-registration error:", error);
    return NextResponse.json({ success: false, error: "Failed to register employee" }, { status: 500 });
  }
}