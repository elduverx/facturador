import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail, normalizeNie } from '@/lib/validation';
import { createPortalSessionCookie } from '@/lib/portal-session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, nie } = body;

    if (!name || !email || !phone || !nie) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedNie = normalizeNie(nie);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }
    if (!normalizedNie || normalizedNie.length < 5) {
      return NextResponse.json({ error: 'Documento de identidad no válido' }, { status: 400 });
    }

    // Check if user already exists
    const existingMatter = await prisma.matter.findFirst({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
        clientNie: { equals: normalizedNie, mode: 'insensitive' }
      }
    });

    const existingAppt = await prisma.appointment.findFirst({
      where: {
        clientEmail: { equals: normalizedEmail, mode: 'insensitive' },
        clientNie: { equals: normalizedNie, mode: 'insensitive' }
      }
    });

    if (existingMatter || existingAppt) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este email y documento. Por favor, inicia sesión.' }, { status: 400 });
    }

    // Generate a unique reference for the matter
    const reference = `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create a new Matter to represent the client profile
    await prisma.matter.create({
      data: {
        reference,
        clientName: name,
        clientEmail: normalizedEmail,
        clientPhone: phone,
        clientNie: normalizedNie,
        title: 'Alta de Cliente',
        procedureType: 'REGISTRO_PORTAL',
        status: 'INITIAL',
        priority: 'NORMAL',
        summary: 'Registro creado desde el portal web.'
      }
    });

    // Create session
    await createPortalSessionCookie({
      email: normalizedEmail,
      nie: normalizedNie,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500 });
  }
}
