import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewsletterForPost } from '@/lib/newsletter';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Titulo requerido' }, { status: 400 });
    }

    const slugInput = typeof body?.slug === 'string' ? body.slug.trim() : '';
    let slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) slug = `post-${Date.now()}`;

    const excerpt = typeof body?.excerpt === 'string' ? body.excerpt.trim() : null;
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const coverImageUrl = typeof body?.coverImageUrl === 'string' ? body.coverImageUrl.trim() : null;
    const status = body?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const created = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImageUrl,
        imageUrls: normalizeList(body?.imageUrls),
        linkUrls: normalizeList(body?.linkUrls),
        embedUrls: normalizeList(body?.embedUrls),
        status,
        publishedAt,
      },
    });

    if (created.status === 'PUBLISHED') {
      await prisma.blogPost.update({
        where: { id: created.id },
        data: { newsletterSentAt: new Date() },
      });
      sendNewsletterForPost(created).catch(console.error);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
