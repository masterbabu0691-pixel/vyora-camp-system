import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, results } = body;

    // Delete any old lab results for this employee (in case of edits)
    await prisma.labResult.deleteMany({ where: { employeeId } });

    // Save all the new test results
    const labData = Object.keys(results).map(testName => ({
      employeeId,
      testName,
      result: results[testName]
    }));
    await prisma.labResult.createMany({ data: labData });

    // Move the patient to Final Review!
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'FINAL_REVIEW' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lab Save Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}