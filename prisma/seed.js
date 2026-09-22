const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Generating Vyora staff credentials...");
  const hashedPassword = await bcrypt.hash('Vyora@2026', 10);

  // Clear old users to prevent duplicates
  await prisma.user.deleteMany();

  // YOUR EXACT TEAM ASSIGNMENTS
  const staff = [
    { name: 'Ankitkumar Patel', username: 'ankit.admin', role: 'SUPER_ADMIN' },
    { name: 'Dr. Dharam', username: 'dr.dharam', role: 'DOCTOR' },
    { name: 'Arjun', username: 'arjun.phlebo', role: 'PHLEBO' },
    { name: 'Arjun1', username: 'arjun1.lab', role: 'LAB_TECH' },
    { name: 'Ruchi', username: 'ruchi.reception', role: 'RECEPTION' }
  ];

  for (const person of staff) {
    await prisma.user.create({
      data: {
        name: person.name,
        username: person.username,
        password: hashedPassword,
        role: person.role
      }
    });
    console.log(`Created account for: ${person.name} (${person.role})`);
  }

  // Ensure ABC Foods test client still exists
  await prisma.client.upsert({
    where: { clientCode: 'ABC-FOODS' },
    update: {},
    create: {
      clientCode: 'ABC-FOODS',
      name: 'ABC Foods Pvt Ltd',
      camps: { create: { campName: 'ABC Foods FSSAI Health Checkup', campDate: new Date('2026-09-19') } }
    }
  });

  console.log("Secure credentials generated successfully!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });