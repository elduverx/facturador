import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, isValidPhone, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentEmail, updates } = body || {};

    if (!currentEmail || typeof currentEmail !== 'string' || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Solicitud invalida' }, { status: 400 });
    }

    const normalizedCurrentEmail = normalizeEmail(currentEmail);
    if (!normalizedCurrentEmail || !isValidEmail(normalizedCurrentEmail)) {
      return NextResponse.json({ error: 'Email actual no valido' }, { status: 400 });
    }

    const data: Record<string, string | null> = {};
    if (typeof updates.name === 'string' && updates.name.trim()) {
      data.clientName = updates.name.trim();
    }
    if (typeof updates.email === 'string' && updates.email.trim()) {
      const normalizedEmail = normalizeEmail(updates.email);
      if (!isValidEmail(normalizedEmail)) {
        return NextResponse.json({ error: 'Email no valido' }, { status: 400 });
      }
      data.clientEmail = normalizedEmail;
    }
    if (typeof updates.phone === 'string' && updates.phone.trim()) {
      const normalizedPhone = normalizePhone(updates.phone);
      if (!isValidPhone(normalizedPhone)) {
        return NextResponse.json({ error: 'Telefono no valido (9 digitos, empieza con 6, 7, 8 o 9)' }, { status: 400 });
      }
      data.clientPhone = normalizedPhone;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'nie')) {
      const nieValue = typeof updates.nie === 'string' ? updates.nie.trim() : '';
      data.clientNie = nieValue ? normalizeNie(nieValue) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const nextEmail = typeof data.clientEmail === 'string' ? data.clientEmail : null;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.updateMany({
        where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
        data,
      });

      if (nextEmail && nextEmail !== normalizedCurrentEmail) {
        // Actualizar otras tablas que usan clientEmail
        await tx.clientNote.updateMany({
          where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
          data: { clientEmail: nextEmail },
        });

        await tx.matter.updateMany({
          where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
          data: { clientEmail: nextEmail },
        });

        await tx.clientDocument.updateMany({
          where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
          data: { clientEmail: nextEmail },
        });

        await tx.communicationLog.updateMany({
          where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
          data: { clientEmail: nextEmail },
        });
      } else if (Object.keys(data).length > 0) {
        // Si no cambio el email pero si otros datos (nombre, telefono, nie), actualizamos Matter
        const matterUpdates: any = {};
        if (data.clientName) matterUpdates.clientName = data.clientName;
        if (data.clientPhone) matterUpdates.clientPhone = data.clientPhone;
        if (Object.prototype.hasOwnProperty.call(data, 'clientNie')) matterUpdates.clientNie = data.clientNie;

        if (Object.keys(matterUpdates).length > 0) {
          await tx.matter.updateMany({
            where: { clientEmail: { equals: normalizedCurrentEmail, mode: 'insensitive' } },
            data: matterUpdates,
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      updated: result.count,
      email: nextEmail || normalizedCurrentEmail,
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
