import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Save sample status and push to Lab Queue
    await prisma.employee.update({
      where: { id: body.employeeId },
      data: { 
        bloodCollected: body.bloodCollected,
        urineCollected: body.urineCollected,
        status: 'LAB_PENDING' 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}