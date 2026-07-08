// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Deactivate old services instead of deleting them to avoid foreign key constraint errors with existing appointments
  await prisma.service.updateMany({
    data: { active: false },
  });
  console.log('Deactivated old services from database.');

  // Seed new services based on the 3 pillars
  const services = [
    // EXTRANJERÍA
    {
      id: 'extranjeria-visados',
      name: 'Visados o estancias por estudios',
      description: 'Gestionamos tu visado para que puedas formarte en España.',
      durationMin: 60,
      price: null,
      sortOrder: 1,
    },
    {
      id: 'extranjeria-arraigos',
      name: 'Arraigos',
      description: 'Social, sociolaboral, socioformativo, por estudio o de familia.',
      durationMin: 60,
      price: null,
      sortOrder: 2,
    },
    {
      id: 'extranjeria-residencia-vinculo',
      name: 'Residencia por vínculo',
      description: 'Para familiares de ciudadanos españoles o de la UE.',
      durationMin: 60,
      price: null,
      sortOrder: 3,
    },
    {
      id: 'extranjeria-reagrupaciones',
      name: 'Reagrupaciones familiares',
      description: 'Trae a tus seres queridos a vivir contigo a España.',
      durationMin: 60,
      price: null,
      sortOrder: 4,
    },
    {
      id: 'extranjeria-nacionalidades',
      name: 'Nacionalidades',
      description: 'Tramitación completa para obtener la nacionalidad española.',
      durationMin: 60,
      price: null,
      sortOrder: 5,
    },
    {
      id: 'extranjeria-renovaciones',
      name: 'Renovaciones',
      description: 'Renueva tus permisos a tiempo y sin complicaciones.',
      durationMin: 45,
      price: null,
      sortOrder: 6,
    },

    // LABORAL
    {
      id: 'laboral-contratos',
      name: 'Contratos y nóminas',
      description: 'Revisión y asesoramiento sobre condiciones laborales.',
      durationMin: 45,
      price: null,
      sortOrder: 7,
    },
    {
      id: 'laboral-despidos',
      name: 'Despidos',
      description: 'Impugnación de despidos improcedentes o nulos.',
      durationMin: 60,
      price: null,
      sortOrder: 8,
    },
    {
      id: 'laboral-vacaciones',
      name: 'Vacaciones',
      description: 'Reclamaciones por vacaciones no disfrutadas o denegadas.',
      durationMin: 45,
      price: null,
      sortOrder: 9,
    },

    // FAMILIA
    {
      id: 'familia-convenios',
      name: 'Convenios reguladores',
      description: 'Redacción y negociación de acuerdos justos y equilibrados.',
      durationMin: 60,
      price: null,
      sortOrder: 10,
    },
    {
      id: 'familia-visitas',
      name: 'Régimen de visitas',
      description: 'Establecimiento y modificación de medidas paterno-filiales.',
      durationMin: 60,
      price: null,
      sortOrder: 11,
    },
    {
      id: 'familia-divorcios',
      name: 'Divorcios',
      description: 'Asesoramiento integral en separaciones de mutuo acuerdo o contenciosos.',
      durationMin: 60,
      price: null,
      sortOrder: 12,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { ...service, active: true },
      create: { ...service, active: true },
    });
  }

  // Seed default office settings
  await prisma.officeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      firmName: 'PV Abogadas',
      firmEmail: 'contacto@pvabogadas.es',
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

  // Seed default admin user
  const bcrypt = require('bcryptjs');
  const initialPinHash = await bcrypt.hash('012345', 12);
  
  await prisma.staffUser.upsert({
    where: { email: 'admin@pvabogadas.es' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@pvabogadas.es',
      loginSlug: 'admin',
      role: 'ADMIN',
      pinHash: initialPinHash,
    },
  });

  console.log(`Seed completado: ${services.length} servicios nuevos (Extranjería, Laboral, Familia) + admin + configuración por defecto`);
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
