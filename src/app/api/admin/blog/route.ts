import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewsletterForPost } from '@/lib/newsletter';
import { composeContent, normalizeAttachments, normalizeList, normalizeSections, slugify } from '@/lib/blog-template';

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
    const sections = Array.isArray(body?.sections) ? normalizeSections(body.sections) : null;
    const content = sections
      ? composeContent(sections)
      : typeof body?.content === 'string'
        ? body.content.trim()
        : '';
    const category = typeof body?.category === 'string' && body.category.trim() ? body.category.trim() : null;
    const coverImageUrl = typeof body?.coverImageUrl === 'string' ? body.coverImageUrl.trim() : null;
    const status = body?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const created = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        sections: sections ?? undefined,
        attachments: normalizeAttachments(body?.attachments),
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
