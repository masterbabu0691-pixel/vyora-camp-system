import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { top, bottom, left, right } = body;

    // Use Prisma's "upsert" (Update if exists, Create if it doesn't)
    const marginSettings = [
      { key: 'MARGIN_TOP', val: top, desc: 'Top margin for physical letterhead header' },
      { key: 'MARGIN_BOTTOM', val: bottom, desc: 'Bottom print margin' },
      { key: 'MARGIN_LEFT', val: left, desc: 'Left print margin' },
      { key: 'MARGIN_RIGHT', val: right, desc: 'Right print margin' }
    ];

    for (const setting of marginSettings) {
      if (setting.val) {
        await prisma.systemSetting.upsert({
          where: { settingKey: setting.key },
          update: { settingVal: setting.val },
          create: { settingKey: setting.key, settingVal: setting.val, description: setting.desc }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    console.error("Settings Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}