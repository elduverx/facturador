import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { normalizeEmail, normalizePhone, normalizeNie } from '@/lib/validation';

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { oldEmail, newName, newEmail, newPhone, newNie } = await request.json();

    if (!oldEmail || !newName || !newEmail) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const email = normalizeEmail(newEmail);
    const phone = newPhone ? normalizePhone(newPhone) : '';
    const nie = newNie ? normalizeNie(newNie) : null;
    const targetEmail = normalizeEmail(oldEmail);

    // Actualizar en todas las tablas
    await prisma.$transaction([
      prisma.appointment.updateMany({
        where: { clientEmail: { equals: targetEmail, mode: 'insensitive' } },
        data: {
          clientName: newName,
          clientEmail: email,
          clientPhone: phone,
          clientNie: nie,
        }
      }),
      prisma.matter.updateMany({
        where: { clientEmail: { equals: targetEmail, mode: 'insensitive' } },
        data: {
          clientName: newName,
          clientEmail: email,
          clientPhone: phone,
          clientNie: nie,
        }
      }),
      prisma.paymentLink.updateMany({
        where: { clientEmail: { equals: targetEmail, mode: 'insensitive' } },
        data: {
          clientName: newName,
          clientEmail: email,
          clientPhone: phone,
        }
      }),
      prisma.clientDocument.updateMany({
        where: { clientEmail: { equals: targetEmail, mode: 'insensitive' } },
        data: {
          clientEmail: email,
        }
      }),
      prisma.clientNote.updateMany({
        where: { clientEmail: { equals: targetEmail, mode: 'insensitive' } },
        data: {
          clientEmail: email,
        }
      })
    ]);

    return NextResponse.json({ 
      success: true,
      client: {
        name: newName,
        email,
        phone,
        nie,
      }
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json({ error: 'Error al guardar los cambios' }, { status: 500 });
  }
}
