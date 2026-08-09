import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, isValidPhone, normalizeEmail, normalizeNie, normalizePhone } from '@/lib/validation';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      select: { clientEmail: true, clientName: true, clientPhone: true, clientNie: true, date: true }
    });

    const matters = await prisma.matter.findMany({
      select: { clientEmail: true, clientName: true, clientPhone: true, clientNie: true, createdAt: true }
    });

    const notes = await prisma.clientNote.findMany({
      select: { clientEmail: true, createdAt: true, content: true } // Some notes might be the only record
    });

    const clientMap = new Map<string, any>();

    appointments.forEach((appt) => {
      const email = appt.clientEmail.toLowerCase();
      const date = appt.date.toISOString().split('T')[0];
      if (!clientMap.has(email)) {
        clientMap.set(email, {
          name: appt.clientName,
          email: appt.clientEmail,
          phone: appt.clientPhone,
          nie: appt.clientNie,
          totalAppointments: 1,
          lastVisit: date
        });
      } else {
        const existing = clientMap.get(email);
        existing.totalAppointments++;
        if (date > existing.lastVisit) {
          existing.lastVisit = date;
          if (appt.clientName) existing.name = appt.clientName;
          if (appt.clientPhone) existing.phone = appt.clientPhone;
          if (appt.clientNie) existing.nie = appt.clientNie;
        }
      }
    });

    matters.forEach((matter) => {
      const email = matter.clientEmail.toLowerCase();
      const date = matter.createdAt.toISOString().split('T')[0];
      if (!clientMap.has(email)) {
        clientMap.set(email, {
          name: matter.clientName,
          email: matter.clientEmail,
          phone: matter.clientPhone,
          nie: matter.clientNie,
          totalAppointments: 0,
          lastVisit: date
        });
      } else {
        const existing = clientMap.get(email);
        if (date > existing.lastVisit) {
          existing.lastVisit = date;
          if (matter.clientName) existing.name = matter.clientName;
          if (matter.clientPhone) existing.phone = matter.clientPhone;
          if (matter.clientNie) existing.nie = matter.clientNie;
        }
      }
    });

    notes.forEach((note) => {
      const email = note.clientEmail.toLowerCase();
      const date = note.createdAt.toISOString().split('T')[0];
      if (!clientMap.has(email)) {
        // Fallback if client only has a note (like manual creation)
        const parts = note.content.split('\n');
        let name = email.split('@')[0];
        let phone = '';
        let nie = null;
        
        // Try to parse JSON from the note if it was created manually
        if (note.content.includes('Datos:')) {
          try {
             const dataStr = note.content.split('Datos:')[1];
             const data = JSON.parse(dataStr);
             if (data.name) name = data.name;
             if (data.phone) phone = data.phone;
             if (data.nie) nie = data.nie;
          } catch(e) {}
        }

        clientMap.set(email, {
          name,
          email: note.clientEmail,
          phone,
          nie,
          totalAppointments: 0,
          lastVisit: date
        });
      }
    });

    const sorted = Array.from(clientMap.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, nie } = body || {};

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Nombre, email y teléfono son obligatorios' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json({ error: 'Teléfono no válido' }, { status: 400 });
    }

    const normalizedNie = nie ? normalizeNie(nie) : null;

    // We don't have a Client table, so we create a ClientNote as an anchor to register them in the system.
    const noteData = { name, phone: normalizedPhone, nie: normalizedNie };
    const noteContent = `Cliente registrado manualmente.\nDatos:${JSON.stringify(noteData)}`;

    await prisma.clientNote.create({
      data: {
        clientEmail: normalizedEmail,
        content: noteContent,
        status: 'DONE',
        isPublic: false
      }
    });

    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

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
