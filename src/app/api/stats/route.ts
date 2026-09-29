import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campId = searchParams.get('campId');

  try {
    // If Admin selects a specific camp, filter by it. Otherwise, show all.
    const filter = campId && campId !== 'all' ? { campId } : {};

    // Execute all counting queries concurrently for massive speed improvements
    const [
      total, 
      preRegistered, 
      phlebo, 
      doctor, 
      review, 
      completed,
      
      // Diagnostics - X-Ray
      xrayPending, xrayArrived, xrayDone,
      // Diagnostics - ECG
      ecgPending, ecgArrived, ecgDone,
      // Diagnostics - PFT
      pftPending, pftArrived, pftDone,
      // Diagnostics - Audiometry
      audioPending, audioArrived, audioDone
    ] = await Promise.all([
      // Core Pipeline (Using your exact database status keys)
      prisma.employee.count({ where: filter }),
      prisma.employee.count({ where: { ...filter, status: 'PRE_REGISTERED' } }),
      prisma.employee.count({ where: { ...filter, status: { in: ['LAB_PENDING', 'LAB_IN_PROGRESS'] } } }),
      prisma.employee.count({ where: { ...filter, status: { in: ['DOCTOR_PENDING', 'DOCTOR_IN_PROGRESS'] } } }),
      prisma.employee.count({ where: { ...filter, status: 'FINAL_REVIEW' } }),
      prisma.employee.count({ where: { ...filter, status: 'COMPLETED' } }),

      // Diagnostics - X-Ray
      prisma.employee.count({ where: { ...filter, xrayStatus: 'PENDING' } }),
      prisma.employee.count({ where: { ...filter, xrayStatus: 'ARRIVED' } }),
      prisma.employee.count({ where: { ...filter, xrayStatus: 'DONE' } }),

      // Diagnostics - ECG
      prisma.employee.count({ where: { ...filter, ecgStatus: 'PENDING' } }),
      prisma.employee.count({ where: { ...filter, ecgStatus: 'ARRIVED' } }),
      prisma.employee.count({ where: { ...filter, ecgStatus: 'DONE' } }),

      // Diagnostics - PFT
      prisma.employee.count({ where: { ...filter, pftStatus: 'PENDING' } }),
      prisma.employee.count({ where: { ...filter, pftStatus: 'ARRIVED' } }),
      prisma.employee.count({ where: { ...filter, pftStatus: 'DONE' } }),

      // Diagnostics - Audiometry
      prisma.employee.count({ where: { ...filter, audioStatus: 'PENDING' } }),
      prisma.employee.count({ where: { ...filter, audioStatus: 'ARRIVED' } }),
      prisma.employee.count({ where: { ...filter, audioStatus: 'DONE' } }),
    ]);

    // Return nested JSON matching the new Dashboard UI
    return NextResponse.json({
      core: {
        total,
        preRegistered,
        phlebo, 
        doctor,
        review,
        completed
      },
      diagnostics: {
        xray: { pending: xrayPending, arrived: xrayArrived, done: xrayDone },
        ecg: { pending: ecgPending, arrived: ecgArrived, done: ecgDone },
        pft: { pending: pftPending, arrived: pftArrived, done: pftDone },
        audio: { pending: audioPending, arrived: audioArrived, done: audioDone }
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}