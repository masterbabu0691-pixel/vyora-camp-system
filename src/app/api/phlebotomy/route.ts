import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, bloodCollected, urineCollected, barcode } = body;
    
    // Save sample status, link the barcode, and push to Lab Queue
    await prisma.employee.update({
      where: { id: employeeId },
      data: { 
        bloodCollected,
        urineCollected,
        barcode: barcode || null, // Saves the barcode securely
        status: 'LAB_PENDING' 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Phlebotomy Save Error:", error);

    // P2002 is Prisma's exact error code for a Unique Constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('barcode')) {
      return NextResponse.json(
        { success: false, error: "This barcode is already assigned to another patient! Please use a new vial." }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}