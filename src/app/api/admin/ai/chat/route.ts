import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { generateChatResponse } from '@/lib/ai';

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { sessionId, content } = await request.json();

    if (!sessionId || !content) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Guardar mensaje del usuario
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
      },
    });

    // 2. Obtener historial
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Limitamos el historial para el contexto
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // 3. Recopilar contexto del sistema
    const [appointments, clients, recentNotes, services] = await Promise.all([
      prisma.appointment.findMany({
        where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
        orderBy: { date: 'desc' },
        take: 15,
        include: { service: true }
      }),
      prisma.appointment.findMany({
        distinct: ['clientEmail'],
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.clientNote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.service.findMany({
        where: { active: true }
      })
    ]);

    const context = {
      currentTime: new Date().toISOString(),
      recentAppointments: appointments.map(a => ({
        id: a.id,
        client: a.clientName,
        email: a.clientEmail,
        date: a.date.toISOString().split('T')[0],
        time: a.startTime,
        service: a.service.name,
        status: a.status,
        notes: a.notes,
        adminNotes: a.adminNotes
      })),
      recentClients: clients.map(c => ({
        name: c.clientName,
        email: c.clientEmail,
        phone: c.clientPhone,
        nie: c.clientNie
      })),
      recentNotes: recentNotes.map(n => ({
        client: n.clientEmail,
        content: n.content,
        status: n.status,
        date: n.createdAt.toISOString()
      })),
      availableServices: services.map(s => ({
        name: s.name,
        price: s.price,
        duration: s.durationMin
      }))
    };

    // 4. Generar respuesta de la IA
    const history = session.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const aiContent = await generateChatResponse(history, context);

    // 5. Guardar respuesta de la IA
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiContent,
      },
    });

    // 6. Actualizar el updatedAt de la sesión y opcionalmente el título
    const updateData: any = { updatedAt: new Date() };
    if ((session.title === 'Nueva conversación' || session.title === 'Nueva consulta imperial') && content.length > 5) {
      updateData.title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData
    });

    return NextResponse.json(assistantMessage);
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({ error: 'Error al procesar el chat' }, { status: 500 });
  }
}
