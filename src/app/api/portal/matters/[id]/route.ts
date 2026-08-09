import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const matter = await prisma.matter.findUnique({
      where: { id },
      include: {
        timeline: { where: { isPublic: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!matter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch documents strictly related to this matter
    const documents = await prisma.clientDocument.findMany({
      where: { matterId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      matter,
      documents
    });
  } catch (err: any) {
    console.error('Error fetching portal matter:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}
