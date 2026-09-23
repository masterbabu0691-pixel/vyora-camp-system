import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, labResults } = body;

    // 1. Clear old lab results to prevent duplicates if edited
    await prisma.labResult.deleteMany({
      where: { employeeId: employeeId }
    });

    // 2. Insert the strict lab results (Only if results were actually typed in)
    if (labResults && labResults.length > 0) {
      // Ensure we only insert fields that exist in your Prisma Schema
      const formattedResults = labResults.map((test: any) => ({
        employeeId: employeeId,
        testName: test.testName,
        result: test.result
        // If 'unit' or 'flag' are NOT in your schema, delete them from this block!
      }));
      
      await prisma.labResult.createMany({
        data: formattedResults
      });
    }

    // 3. Push patient to the Final Review Queue
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'LAB_DONE' } 
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Lab Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}