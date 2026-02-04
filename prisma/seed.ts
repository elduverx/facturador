// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed services
  const services = [
    {
      name: 'Arraigo Social/Laboral/Familiar',
      description: 'Tramitacion de autorizacion de residencia por arraigo social, laboral o familiar',
      durationMin: 60,
      price: null,
      sortOrder: 1,
    },
    {
      name: 'Autorizacion de residencia (NIE)',
      description: 'Solicitud y tramitacion del Numero de Identidad de Extranjero',
      durationMin: 60,
      price: null,
      sortOrder: 2,
    },
    {
      name: 'Renovacion de residencia',
      description: 'Renovacion de tarjeta de residencia y permisos de trabajo',
      durationMin: 45,
      price: null,
      sortOrder: 3,
    },
    {
      name: 'Nacionalidad espanola',
      description: 'Tramitacion de solicitud de nacionalidad espanola por residencia',
      durationMin: 60,
      price: null,
      sortOrder: 4,
    },
    {
      name: 'Reagrupacion familiar',
      description: 'Solicitud de reagrupacion de familiares de residentes en Espana',
      durationMin: 60,
      price: null,
      sortOrder: 5,
    },
    {
      name: 'Asilo y proteccion internacional',
      description: 'Solicitud de asilo y proteccion internacional para refugiados',
      durationMin: 90,
      price: null,
      sortOrder: 6,
    },
    {
      name: 'Consulta general de extranjeria',
      description: 'Consulta sobre cualquier tramite de extranjeria e inmigracion',
      durationMin: 30,
      price: null,
      sortOrder: 7,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20) },
      update: service,
      create: service,
    });
  }

  // Seed default office settings
  await prisma.officeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      firmName: 'Consultorio de Extranjeria',
      firmEmail: '',
      firmPhone: '',
      firmAddress: '',
      startHour: 9,
      endHour: 18,
      slotDurationMin: 30,
      lunchStartHour: 14,
      lunchEndHour: 15,
      workDays: [1, 2, 3, 4, 5],
      maxAppointmentsPerDay: 0,
    },
  });

  console.log('Seed completado: 7 servicios + configuracion por defecto');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
