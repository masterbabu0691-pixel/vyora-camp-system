import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // 1. CRITICAL FIX: Extract campId from the URL to filter correctly
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');

    if (!campId) {
      return NextResponse.json({ success: true, preRegistered: [], recentCheckIns: [] });
    }

    // Fetch only PRE_REGISTERED patients for the selected camp
    const preRegistered = await prisma.employee.findMany({
      where: { 
        campId: campId,
        status: 'PRE_REGISTERED' // CRITICAL FIX: Matches your bulk upload status
      }, 
      orderBy: { name: 'asc' }
    });

    // Fetch recent check-ins for this specific camp
    const recentCheckIns = await prisma.employee.findMany({
      where: { 
        campId: campId,
        status: { not: 'PRE_REGISTERED' } 
      }, 
      include: { vitals: true }, 
      orderBy: { updatedAt: 'desc' }, 
      take: 20
    });

    return NextResponse.json({ success: true, preRegistered, recentCheckIns });
  } catch (error) {
    console.error("Reception GET Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. EDIT MODE: Updating an already checked-in patient
    if (body.isEditMode) {
      const updatedEmployee = await prisma.employee.update({
        where: { id: body.id },
        data: {
          name: body.name, empCode: body.empCode, 
          department: body.department, designation: body.designation, 
          contactNo: body.contactNo, age: parseInt(body.age), sex: body.sex,
          status: 'RECEPTION_DONE',
          vitals: { update: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) } }
        }
      });
      return NextResponse.json({ success: true, employee: updatedEmployee, message: "Details updated!" });
    }

    // 2. CHECK-IN MODE: Processing a pre-registered patient
    if (body.id && !body.isEditMode) {
      const updatedEmployee = await prisma.employee.update({
        where: { id: body.id },
        data: {
          department: body.department, designation: body.designation, 
          age: parseInt(body.age), sex: body.sex, contactNo: body.contactNo, 
          status: 'RECEPTION_DONE', 
          vitals: { create: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) } }
        }
      });
      return NextResponse.json({ success: true, employee: updatedEmployee, message: "Checked in successfully!" });
    } 

    // 3. WALK-IN MODE: Creating a brand new patient from scratch for the selected camp
    if (!body.campId) {
      return NextResponse.json({ success: false, error: "Camp selection is required for walk-ins." }, { status: 400 });
    }

    // CRITICAL FIX: Calculate the correct sequential serial number for walk-ins
    const currentCount = await prisma.employee.count({ where: { campId: body.campId } });
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    
    const newEmployee = await prisma.employee.create({
      data: {
        campId: body.campId, 
        serialNo: currentCount + 1, 
        uhid: `VYH-${currentYear}-${randomNum}`,
        empCode: body.empCode || "", 
        name: body.name, 
        department: body.department || "", 
        designation: body.designation || "", 
        age: parseInt(body.age), 
        sex: body.sex, 
        contactNo: body.contactNo, 
        status: 'RECEPTION_DONE', 
        vitals: { create: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) } }
      }
    });
    return NextResponse.json({ success: true, employee: newEmployee, message: "Walk-in checked in!" });
    
  } catch (error) {
    console.error("Reception POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process reception data." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false });

    await prisma.vitals.deleteMany({ where: { employeeId: id } });
    await prisma.examination.deleteMany({ where: { employeeId: id } });
    await prisma.labResult.deleteMany({ where: { employeeId: id } });
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}