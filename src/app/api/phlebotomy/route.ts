import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Save sample status and push to Lab Queue exactly as you defined
    await prisma.employee.update({
      where: { id: body.employeeId },
      data: { 
        bloodCollected: body.bloodCollected,
        urineCollected: body.urineCollected,
        status: 'LAB_PENDING' // This perfectly links to the Laboratory step in our router above
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Phlebotomy Save Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update samples" }, { status: 500 });
  }
}