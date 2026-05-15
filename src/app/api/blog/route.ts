import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  const limit = limitParam ? Math.max(1, Number(limitParam)) : null;

  try {
    if (limit) {
      const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      });
      return NextResponse.json(posts);
    }

    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
    const pageSize = pageSizeParam ? Math.min(20, Math.max(1, Number(pageSizeParam))) : 6;

    const total = await prisma.blogPost.count({ where: { status: 'PUBLISHED' } });
    const items = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error('Error cargando posts publicados:', error);
    return NextResponse.json(
      { items: [], total: 0, page: 1, pageSize: 0, error: 'Base de datos no disponible' },
      { status: 503 }
    );
  }
}
