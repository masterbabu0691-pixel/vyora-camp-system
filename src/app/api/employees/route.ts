import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queue = searchParams.get('queue');
  const id = searchParams.get('id');

  try {
    if (id) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { vitals: true, examination: true, labResults: true }
      });
      return NextResponse.json({ success: true, employee });
    }

    let filter = {};
    if (queue === 'phlebo') filter = { status: 'PHLEBO_PENDING' };
    if (queue === 'doctor') filter = { status: { in: ['DOCTOR_PENDING', 'DOCTOR_IN_PROGRESS'] } };
    if (queue === 'lab') filter = { status: { in: ['LAB_PENDING', 'LAB_IN_PROGRESS'] } };
    if (queue === 'review') filter = { status: 'FINAL_REVIEW' };

    const employees = await prisma.employee.findMany({
      where: filter,
      include: { vitals: true },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const camp = await prisma.camp.findFirst();
    if (!camp) throw new Error("No active camp found");

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    
    const newEmployee = await prisma.employee.create({
      data: {
        campId: camp.id,
        serialNo: Math.floor(Math.random() * 1000), 
        uhid: `VYH-2026-${randomNum}`,
        empCode: body.empCode,
        name: body.name,
        age: parseInt(body.age),
        sex: body.sex,
        department: body.department,
        contactNo: body.contactNo,
        status: 'DOCTOR_PENDING', 
        vitals: {
          create: { height: parseFloat(body.height), weight: parseFloat(body.weight), bmi: parseFloat(body.bmi) }
        }
      }
    });
    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}