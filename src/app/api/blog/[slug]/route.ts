import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json(post);
}
