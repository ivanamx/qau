import { PrismaClient } from '../generated/prisma-client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roles = [
  { name: 'superadmin', description: 'Alcaldesa y equipo estratégico' },
  { name: 'admin', description: 'Administrador general' },
  { name: 'operator', description: 'Operador / empleado' },
  { name: 'citizen', description: 'Ciudadano' },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Seed: roles creados correctamente.');

  // Superusuario (solo si no existe)
  const superadminRole = await prisma.role.findUnique({ where: { name: 'superadmin' } });
  if (superadminRole) {
    const existingSuper = await prisma.user.findFirst({ where: { email: 'superadmin@alcaldia.local' } });
    if (!existingSuper) {
      await prisma.user.create({
        data: {
          email: 'superadmin@alcaldia.local',
          passwordHash: await bcrypt.hash('super123', 12),
          roleId: superadminRole.id,
        },
      });
      console.log('Seed: superusuario superadmin@alcaldia.local creado (contraseña: super123).');
    }
  }

  // Usuario admin para pruebas de dashboard (solo si no existe)
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@alcaldia.local' } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: 'admin@alcaldia.local',
          passwordHash: await bcrypt.hash('admin123', 12),
          roleId: adminRole.id,
        },
      });
      console.log('Seed: usuario admin@alcaldia.local creado (contraseña: admin123).');
    }
  }

  // Ciudadano de prueba (solo si no existe)
  const existingCitizen = await prisma.citizen.findFirst({ where: { email: 'ciudadano@alcaldia.local' } });
  if (!existingCitizen) {
    await prisma.citizen.create({
      data: {
        email: 'ciudadano@alcaldia.local',
        phone: '5512345678',
        passwordHash: await bcrypt.hash('ciudadano123', 12),
        nombre: 'Ciudadano',
        apellidos: 'Prueba',
      },
    });
    console.log('Seed: ciudadano ciudadano@alcaldia.local creado (contraseña: ciudadano123).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
