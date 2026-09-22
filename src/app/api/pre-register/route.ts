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
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    
    const newEmployee = await prisma.employee.create({
      data: {
        campId: body.campId,
        serialNo: Math.floor(Math.random() * 1000), 
        uhid: `VYH-2026-${randomNum}`,
        empCode: body.empCode || "",
        name: body.name,
        department: body.department || "",
        designation: body.designation || "", // Added Designation
        
        age: body.age ? parseInt(body.age) : null,
        sex: body.sex || null,
        contactNo: body.contactNo || "",
        status: 'PRE_REGISTERED'
      }
    });
    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}