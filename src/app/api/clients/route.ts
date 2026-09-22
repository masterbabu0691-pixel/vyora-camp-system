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
    
    const client = await prisma.client.upsert({
      where: { clientCode: body.clientCode },
      update: {},
      create: {
        clientCode: body.clientCode,
        name: body.name,
      }
    });

    const camp = await prisma.camp.create({
      data: {
        clientId: client.id,
        campName: body.campName,
        campDate: new Date(body.campDate),
      }
    });

    console.log("Successfully saved client and camp!");
    return NextResponse.json({ success: true, client, camp });
  } catch (error: any) {
    console.error("FAILED to save client:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}