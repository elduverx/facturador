import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderTemplate } from '@/lib/legal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matterId = typeof body?.matterId === 'string' ? body.matterId : '';
    const templateId = typeof body?.templateId === 'string' ? body.templateId : '';

    if (!matterId || !templateId) {
      return NextResponse.json({ error: 'Expediente y plantilla son obligatorios' }, { status: 400 });
    }

    const [matter, template] = await Promise.all([
      prisma.matter.findUnique({ where: { id: matterId } }),
      prisma.documentTemplate.findUnique({ where: { id: templateId } }),
    ]);

    if (!matter || !template) {
      return NextResponse.json({ error: 'Expediente o plantilla no encontrado' }, { status: 404 });
    }

    const document = renderTemplate(template.content, {
      reference: matter.reference,
      clientName: matter.clientName,
      clientEmail: matter.clientEmail,
      clientPhone: matter.clientPhone,
      clientNie: matter.clientNie,
      title: matter.title,
      procedureType: matter.procedureType,
      status: matter.status,
      summary: matter.summary,
      riskNotes: matter.riskNotes,
      responsible: matter.responsible,
      nextActionAt: matter.nextActionAt ? matter.nextActionAt.toISOString().split('T')[0] : '',
    });

    await prisma.matterTimeline.create({
      data: {
        matterId,
        type: 'DOCUMENT',
        title: `Documento generado: ${template.name}`,
        content: document.slice(0, 1000),
        actor: 'Admin',
      },
    });

    return NextResponse.json({
      fileName: `${matter.reference}-${template.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.txt`,
      document,
    });
  } catch (error) {
    console.error('Error generando documento:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
