import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Mail, MessageCircle, Phone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import ArticleBody, { filledSections, readingMinutes } from '@/components/blog/ArticleBody';
import { CoverFallback } from '@/components/blog/CoverFallback';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { SiteHeader } from '@/components/public/SiteHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import { NewsletterSignup } from '@/components/public/NewsletterSignup';
import { FIRM_SIGNATURE } from '@/lib/blog-template';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pvabogadas.es';

// lucide-react 1.x no longer ships brand logos.
const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm7 0h3.8v1.55h.06c.53-.96 1.83-1.98 3.77-1.98 4.03 0 4.77 2.55 4.77 5.86V21h-4v-5.1c0-1.22-.02-2.78-1.74-2.78-1.74 0-2.01 1.33-2.01 2.7V21h-4V9.75Z" />
  </svg>
);
const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.55V4.47A20.8 20.8 0 0 0 14.3 4.3c-2.24 0-3.8 1.37-3.8 3.88V10.5H8v3h2.5V21h3Z" />
  </svg>
);

const formatDate = (value: Date) => new Date(value).toLocaleDateString('es-ES', { dateStyle: 'long' });

const getEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      return `https://player.vimeo.com/video/${parsed.pathname.replace('/', '')}`;
    }
    return url;
  } catch {
    return url;
  }
};

// Shared between generateMetadata and the page so the post is queried once per request.
const getPost = cache(async (slug: string) => {
  try {
    return await prisma.blogPost.findFirst({ where: { slug, status: 'PUBLISHED' } });
  } catch (error) {
    console.error('Error cargando post publicado:', error);
    return null;
  }
});

async function getRelated(id: string, category: string | null) {
  try {
    const sameCategory = category
      ? await prisma.blogPost.findMany({
          where: { status: 'PUBLISHED', category, id: { not: id } },
          orderBy: { publishedAt: 'desc' },
          take: 3,
        })
      : [];
    if (sameCategory.length >= 3) return sameCategory;
    const latest = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', id: { notIn: [id, ...sameCategory.map((p) => p.id)] } },
      orderBy: { publishedAt: 'desc' },
      take: 3 - sameCategory.length,
    });
    return [...sameCategory, ...latest];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Artículo no encontrado | PV Abogadas' };

  const description = post.excerpt || post.content.slice(0, 160);
  // Social networks don't render SVG previews, so fall back to the logo.
  const image = post.coverImageUrl && !post.coverImageUrl.endsWith('.svg') ? post.coverImageUrl : '/logopv.jpeg';

  return {
    title: `${post.title} | PV Abogadas`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      images: [{ url: image }],
      publishedTime: (post.publishedAt || post.createdAt).toISOString(),
      section: post.category || undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  const sections = filledSections(post.sections);
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  const date = post.publishedAt || post.createdAt;
  const minutes = readingMinutes(post.content);
  const related = await getRelated(post.id, post.category);

  const url = `${BASE_URL}/blog/${post.slug}`;
  const shareText = encodeURIComponent(`${post.title} — ${url}`);
  const shareLinks = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${shareText}`, icon: MessageCircle },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, icon: LinkedinIcon },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: FacebookIcon },
    { label: 'Email', href: `mailto:?subject=${encodeURIComponent(post.title)}&body=${shareText}`, icon: Mail },
  ];

  const toc = [
    ...sections.map((section) => ({ id: section.key, label: section.heading })),
    ...(attachments.length ? [{ id: 'documentos', label: 'Documentos descargables' }] : []),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: date.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: post.category || undefined,
    mainEntityOfPage: url,
    author: { '@type': 'LegalService', name: FIRM_SIGNATURE.name, url: BASE_URL },
    publisher: { '@type': 'Organization', name: FIRM_SIGNATURE.name, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logopv.jpeg` } },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      <ReadingProgress />
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className={`relative bg-[var(--pv-navy)] overflow-hidden ${post.coverImageUrl ? 'pb-36 sm:pb-48' : 'pb-16 sm:pb-20'} pt-12 sm:pt-16`}>
          <div className="absolute -left-40 top-0 w-96 h-96 bg-[var(--pv-gold)]/20 rounded-full blur-[120px]" aria-hidden />
          <div className="absolute -right-40 bottom-0 w-96 h-96 bg-[var(--pv-gold)]/10 rounded-full blur-[120px]" aria-hidden />
          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6">
            <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 mb-8" aria-label="Migas de pan">
              <Link href="/" className="hover:text-[var(--pv-gold)] transition-colors">Inicio</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[var(--pv-gold)] transition-colors">Blog</Link>
              {post.category && (
                <>
                  <span>/</span>
                  <span className="text-[var(--pv-gold)]">{post.category}</span>
                </>
              )}
            </nav>

            {post.category && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[var(--pv-gold)]/40 text-[var(--pv-gold)] text-[10px] font-bold uppercase tracking-[0.2em] mb-6 bg-white/5 backdrop-blur-md">
                {post.category}
              </span>
            )}

            <h1 className="font-article text-[34px] leading-[1.15] sm:text-5xl lg:text-[56px] font-semibold !text-white tracking-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="font-article mt-6 text-lg sm:text-xl leading-relaxed text-white/75 max-w-3xl">{post.excerpt}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2.5">
                <img src="/logopv.jpeg" alt="" className="h-8 w-8 rounded-full border border-[var(--pv-gold)] object-cover" />
                <span className="text-white font-medium">{FIRM_SIGNATURE.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-[var(--pv-gold)]" /> {formatDate(date)}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={15} className="text-[var(--pv-gold)]" /> {minutes} min de lectura
              </span>
            </div>
          </div>
        </section>

        {post.coverImageUrl && (
          <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 -mt-28 sm:-mt-40">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full aspect-[1200/630] object-cover rounded-2xl shadow-2xl ring-1 ring-black/5 bg-[var(--pv-navy)]"
            />
          </div>
        )}

        {/* Body */}
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0 max-w-[720px]">
            <ArticleBody content={post.content} sections={post.sections} attachments={attachments} />

            {post.embedUrls?.length > 0 && (
              <div className="grid grid-cols-1 gap-4 mt-12">
                {post.embedUrls.map((embed) => (
                  <div key={embed} className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg">
                    <iframe
                      src={getEmbedUrl(embed)}
                      title={post.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            )}
            {post.imageUrls?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-12">
                {post.imageUrls.map((image) => (
                  <img key={image} src={image} alt={post.title} className="rounded-xl object-cover h-40 w-full shadow" />
                ))}
              </div>
            )}
            {post.linkUrls?.length > 0 && (
              <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--pv-gold)] mb-3">Fuentes y enlaces</p>
                <ul className="space-y-2">
                  {post.linkUrls.map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noreferrer" className="text-sm text-[var(--pv-navy)] underline decoration-[var(--pv-gold)]/50 underline-offset-4 hover:decoration-[var(--pv-gold)] break-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Share (mobile) */}
            <div className="lg:hidden mt-12 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 mr-1">Compartir</span>
              {shareLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Compartir en ${label}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-[var(--pv-navy)] hover:border-[var(--pv-gold)] hover:text-[var(--pv-gold)] transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {toc.length > 1 && (
                <nav className="rounded-2xl border border-stone-200 bg-white p-6" aria-label="Índice del artículo">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--pv-gold)] mb-4">En este artículo</p>
                  <ol className="space-y-2.5">
                    {toc.map((item, index) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`} className="group flex gap-3 text-sm leading-snug text-stone-600 hover:text-[var(--pv-navy)]">
                          <span className="font-roman text-[11px] font-bold text-[var(--pv-gold)]/70 group-hover:text-[var(--pv-gold)] pt-0.5 tabular-nums">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <div className="relative overflow-hidden rounded-2xl bg-[var(--pv-navy)] p-6 text-white">
                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[var(--pv-gold)]/20 blur-3xl" aria-hidden />
                <p className="relative font-roman text-base font-bold uppercase leading-snug">¿Su caso es parecido?</p>
                <p className="relative mt-2 text-sm text-white/70 leading-relaxed">
                  Estudiamos su situación concreta y le indicamos la mejor vía.
                </p>
                <Link href="/reservar" className="btn-roman relative mt-5 w-full !py-3 text-sm">
                  Reservar consulta <ArrowRight size={16} />
                </Link>
                <Link href="/contacto" className="relative mt-3 flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white">
                  <Phone size={12} /> Prefiero que me contacten
                </Link>
              </div>

              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 mb-3">Compartir</p>
                <div className="flex gap-2">
                  {shareLinks.map(({ label, href, icon: Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Compartir en ${label}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-[var(--pv-navy)] hover:border-[var(--pv-gold)] hover:text-[var(--pv-gold)] transition-colors">
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile CTA */}
        <section className="lg:hidden px-5 pb-14">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--pv-navy)] p-7 text-white text-center">
            <p className="font-roman text-lg font-bold uppercase">¿Su caso es parecido?</p>
            <p className="mt-2 text-sm text-white/70">Estudiamos su situación concreta y le indicamos la mejor vía.</p>
            <Link href="/reservar" className="btn-roman mt-5 w-full !py-3 text-sm">
              Reservar consulta <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-stone-200 bg-white py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--pv-gold)] mb-2">Siga leyendo</p>
                  <h2 className="font-article text-3xl font-semibold !text-[var(--pv-navy)]">Artículos relacionados</h2>
                </div>
                <Link href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[var(--pv-navy)] hover:text-[var(--pv-gold)]">
                  Ver todos <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/blog/${item.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#f8f9fa] transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="aspect-[1200/630] bg-[var(--pv-navy)] overflow-hidden">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <CoverFallback category={item.category} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2">{item.category}</span>
                      )}
                      <h3 className="font-article text-lg font-semibold leading-snug !text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)]">{item.title}</h3>
                      <span className="mt-auto pt-4 text-xs text-stone-500">{formatDate(item.publishedAt || item.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-[#f8f9fa] py-16">
          <div className="max-w-3xl mx-auto px-5 sm:px-6">
            <NewsletterSignup />
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pv-navy)] hover:text-[var(--pv-gold)]">
            <ArrowLeft size={16} /> Volver al blog
          </Link>
        </div>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
