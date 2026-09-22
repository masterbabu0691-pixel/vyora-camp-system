import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Update the Vitals with Blood Pressure, Heart Rate, etc.
    await prisma.vitals.update({
      where: { employeeId: body.employeeId },
      data: {
        heartRate: body.heartRate ? parseInt(body.heartRate) : null,
        bloodPress: body.bloodPress,
        spO2: body.spO2 ? parseFloat(body.spO2) : null,
      }
    });

    // 2. Save the Doctor's Physical Examination safely
    await prisma.examination.upsert({
      where: { employeeId: body.employeeId },
      update: {
        pastHistory: body.pastHistory, comorbidities: body.comorbidities,
        eyeRight: body.eyeRight, eyeLeft: body.eyeLeft, colorBlindness: body.colorBlindness,
        ent: body.ent, oral: body.oral, headNeck: body.headNeck,
        lungsChest: body.lungsChest, cardiovascular: body.cardiovascular, skinVaricose: body.skinVaricose,
      },
      create: {
        employeeId: body.employeeId,
        pastHistory: body.pastHistory, comorbidities: body.comorbidities,
        eyeRight: body.eyeRight, eyeLeft: body.eyeLeft, colorBlindness: body.colorBlindness,
        ent: body.ent, oral: body.oral, headNeck: body.headNeck,
        lungsChest: body.lungsChest, cardiovascular: body.cardiovascular, skinVaricose: body.skinVaricose,
      }
    });

// 3. Move the patient to the Phlebotomy Queue!
    await prisma.employee.update({
      where: { id: body.employeeId },
      data: { status: 'PHLEBO_PENDING' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Examination Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}