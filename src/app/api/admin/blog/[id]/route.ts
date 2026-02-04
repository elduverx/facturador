import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewsletterForPost } from '@/lib/newsletter';

type RouteParams = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.title === 'string') data.title = body.title.trim();
    if (typeof body?.excerpt === 'string') data.excerpt = body.excerpt.trim();
    if (typeof body?.content === 'string') data.content = body.content.trim();
    if (typeof body?.coverImageUrl === 'string') data.coverImageUrl = body.coverImageUrl.trim() || null;
    if (Array.isArray(body?.imageUrls)) data.imageUrls = normalizeList(body.imageUrls);
    if (Array.isArray(body?.linkUrls)) data.linkUrls = normalizeList(body.linkUrls);
    if (Array.isArray(body?.embedUrls)) data.embedUrls = normalizeList(body.embedUrls);

    if (typeof body?.slug === 'string') {
      const slug = slugify(body.slug.trim());
      if (slug) data.slug = slug;
    }

    if (body?.status === 'PUBLISHED' || body?.status === 'DRAFT') {
      data.status = body.status;
      data.publishedAt = body.status === 'PUBLISHED' ? new Date() : null;
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    const shouldSend =
      updated.status === 'PUBLISHED' &&
      existing.status !== 'PUBLISHED' &&
      !existing.newsletterSentAt;

    if (shouldSend) {
      await prisma.blogPost.update({
        where: { id },
        data: { newsletterSentAt: new Date() },
      });
      sendNewsletterForPost(updated).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error actualizando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
