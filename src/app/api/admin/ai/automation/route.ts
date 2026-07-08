import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAdminAutomationPlan } from '@/lib/ai';
import { getAdminAppointmentScope } from '@/lib/admin-scope';

const CONFIDENCE_TO_CREATE_NOTE = 0.75;
const NOTE_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING', 'DONE'] as const;

const toDateOnly = (date: Date) => date.toISOString().split('T')[0];

export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Configura ANTHROPIC_API_KEY en .env para activar Claude.' },
        { status: 503 }
      );
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const toDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const duplicateWindow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const appointmentScope = await getAdminAppointmentScope();
    const [appointments, recentNotes] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          AND: [
            {
              OR: [
                { date: { gte: fromDate, lte: toDate } },
                { createdAt: { gte: fromDate } },
              ],
            },
            appointmentScope,
          ],
        },
        include: { service: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 80,
      }),
      prisma.clientNote.findMany({
        where: { createdAt: { gte: fromDate } },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
    ]);

    const plan = await generateAdminAutomationPlan({
      generatedAt: now.toISOString(),
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone,
        clientNie: appointment.clientNie,
        date: toDateOnly(appointment.date),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        serviceName: appointment.service.name,
        servicePrice: appointment.service.price,
        notes: appointment.notes,
        adminNotes: appointment.adminNotes,
        createdAt: appointment.createdAt.toISOString(),
      })),
      recentNotes: recentNotes.map((note) => ({
        id: note.id,
        clientEmail: note.clientEmail,
        content: note.content,
        status: note.status,
        tags: note.tags,
        isPublic: note.isPublic,
        createdAt: note.createdAt.toISOString(),
      })),
    });

    const createdNotes = [];

    for (const draft of plan.notas_automaticas) {
      if (!draft.clientEmail || !draft.content || draft.confidence < CONFIDENCE_TO_CREATE_NOTE) {
        continue;
      }

      if (!NOTE_STATUSES.includes(draft.status)) {
        continue;
      }

      const existing = await prisma.clientNote.findFirst({
        where: {
          clientEmail: { equals: draft.clientEmail, mode: 'insensitive' },
          createdAt: { gte: duplicateWindow },
          tags: { has: 'AUTO_CLAUDE' },
          content: draft.content,
        },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const created = await prisma.clientNote.create({
        data: {
          clientEmail: draft.clientEmail,
          content: draft.content,
          status: draft.status,
          tags: Array.from(new Set(['AUTO_CLAUDE', ...draft.tags])).slice(0, 8),
          isPublic: false,
        },
      });

      createdNotes.push(created);
    }

    return NextResponse.json({
      success: true,
      plan,
      createdNotes,
      createdCount: createdNotes.length,
    });
  } catch (error) {
    console.error('Error ejecutando automatizacion IA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando automatizacion IA' },
      { status: 500 }
    );
  }
}
