import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { isAdminAuthenticated } from '@/lib/auth';
import { generateBlogChatTurn, type BlogArticleState } from '@/lib/ai';
import { normalizeSections } from '@/lib/blog-template';

// Covers are served as static files, so strip anything that could execute if opened directly.
function sanitizeSvg(svg: string) {
  const start = svg.indexOf('<svg');
  const end = svg.lastIndexOf('</svg>');
  if (start === -1 || end === -1) return null;
  return svg
    .slice(start, end + 6)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s(?:xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, '');
}

async function saveCover(svg: string) {
  const clean = sanitizeSvg(svg);
  if (!clean) return null;
  const filename = `${randomUUID()}.svg`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'blog', 'covers');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), clean, 'utf8');
  return `/uploads/blog/covers/${filename}`;
}

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages)
      ? body.messages
          .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
          .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 8000) }))
      : [];

    // The conversation must start with a user turn.
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const a = body?.article ?? {};
    const article: BlogArticleState = {
      title: String(a.title || ''),
      excerpt: String(a.excerpt || ''),
      category: String(a.category || ''),
      sections: normalizeSections(a.sections),
      coverImageUrl: String(a.coverImageUrl || ''),
      attachments: Array.isArray(a.attachments) ? a.attachments.map((f: any) => ({ name: String(f?.name || '') })) : [],
      status: a.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    };

    const turn = await generateBlogChatTurn(messages, article);
    const coverImageUrl = turn.coverSvg ? await saveCover(turn.coverSvg) : null;

    return NextResponse.json({
      reply: turn.reply,
      suggestions: turn.suggestions,
      article: turn.article,
      coverImageUrl,
    });
  } catch (error) {
    console.error('Error en el chat del blog:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
