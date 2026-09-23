import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const preRegistered = await prisma.employee.findMany({
      where: { status: 'REGISTERED' }, // Keeping this aligned with your schema default
      orderBy: { name: 'asc' }
    });
    const recentCheckIns = await prisma.employee.findMany({
      where: { status: { not: 'REGISTERED' } }, 
      include: { vitals: true }, 
      orderBy: { updatedAt: 'desc' }, 
      take: 20
    });
    return NextResponse.json({ success: true, preRegistered, recentCheckIns });
  } catch (error) {
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
          status: 'RECEPTION_DONE', // CRITICAL PIPELINE FIX
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
          status: 'RECEPTION_DONE', // CRITICAL PIPELINE FIX
          vitals: { create: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) } }
        }
      });
      return NextResponse.json({ success: true, employee: updatedEmployee, message: "Checked in successfully!" });
    } 

    // 3. WALK-IN MODE: Creating a brand new patient from scratch
    const camp = await prisma.camp.findFirst(); 
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newEmployee = await prisma.employee.create({
      data: {
        campId: camp!.id, serialNo: Math.floor(Math.random() * 1000), uhid: `VYH-2026-${randomNum}`,
        empCode: body.empCode || "", name: body.name, 
        department: body.department || "", designation: body.designation || "", 
        age: parseInt(body.age), sex: body.sex, contactNo: body.contactNo, 
        status: 'RECEPTION_DONE', // CRITICAL PIPELINE FIX
        vitals: { create: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) } }
      }
    });
    return NextResponse.json({ success: true, employee: newEmployee, message: "Walk-in checked in!" });
    
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
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