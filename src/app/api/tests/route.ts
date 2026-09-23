import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all tests
export async function GET() {
  try {
    const tests = await prisma.testMaster.findMany({
      orderBy: [
        { category: 'asc' },
        { testName: 'asc' }
      ]
    });
    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new test
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testName, category, unit, normalRange } = body;

    const newTest = await prisma.testMaster.create({
      data: { testName, category, unit, normalRange }
    });

    return NextResponse.json({ success: true, test: newTest });
  } catch (error: any) {
    // Catch unique constraint errors (e.g. duplicate test name)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A test with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (Toggle Active Status)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    await prisma.testMaster.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a test
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Test ID required' }, { status: 400 });

  try {
    await prisma.testMaster.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete test." }, { status: 500 });
  }
}