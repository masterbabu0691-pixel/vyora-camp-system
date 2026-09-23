import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET all users (Never sends passwords to the frontend!)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new user securely
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, role } = body;

    // Encrypt the password before saving it to Neon
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, username, password: hashedPassword, role },
      select: { id: true, name: true, username: true, role: true, isActive: true }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (Toggle Active Status)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}