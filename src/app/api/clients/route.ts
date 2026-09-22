import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ULTIMATE CACHE BUSTING (Tells Next.js to NEVER store this page)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: { camps: { orderBy: { campDate: 'desc' } } }
    });
    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    console.error("GET Clients Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Attempting to save client:", body);
    
    // 1. AUTO-GENERATE CLIENT ID (if the frontend didn't send an existing one)
    let finalClientCode = body.clientCode;
    
    if (!finalClientCode) {
      const count = await prisma.client.count();
      const currentYear = new Date().getFullYear();
      finalClientCode = `VHC-CL-${currentYear}-${String(count + 1).padStart(3, "0")}`;
    }

    // 2. UPSERT CLIENT (Creates new or links to existing)
    const client = await prisma.client.upsert({
      where: { clientCode: finalClientCode },
      update: {},
      create: {
        clientCode: finalClientCode,
        name: body.name,
      }
    });

    // 3. CREATE CAMP (Now includes HR Tracking & Dynamic Test Checklist)
    const camp = await prisma.camp.create({
      data: {
        clientId: client.id,
        campName: body.campName,
        campDate: new Date(body.campDate),
        
        // New HR Tracking Fields
        leadDoctor: body.leadDoctor || null,
        phlebotomist: body.phlebotomist || null,
        campCoordinator: body.campCoordinator || null,
        technician: body.technician || null,
        
        // New Dynamic Test Checklist (Defaults to full package if nothing is sent)
        testChecklist: body.testChecklist || "CBC,RBS,URINE,STOOL,WIDAL,VISION,BP,BMI",
      }
    });

    console.log(`Successfully saved client ${finalClientCode} and camp!`);
    return NextResponse.json({ success: true, client, camp });
  } catch (error: any) {
    console.error("FAILED to save client:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}