'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CoverFallback } from './CoverFallback';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogResponse {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 7;

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-ES', { dateStyle: 'long' });

const summary = (post: BlogPost) => post.excerpt || post.content.replace(/\s+/g, ' ').slice(0, 180) + '…';

function Cover({ post, className }: { post: BlogPost; className: string }) {
  return (
    <div className={`bg-[var(--pv-navy)] overflow-hidden ${className}`}>
      {post.coverImageUrl ? (
        <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <CoverFallback category={post.category} />
      )}
    </div>
  );
}

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/blog?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((data: BlogResponse | BlogPost[]) => {
        if (!active) return;
        if (Array.isArray(data)) {
          setPosts(data);
          setTotal(data.length);
        } else {
          setPosts(Array.isArray(data.items) ? data.items : []);
          setTotal(typeof data.total === 'number' ? data.total : 0);
        }
      })
      .catch(() => {
        if (!active) return;
        setPosts([]);
        setTotal(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 rounded-2xl bg-stone-200/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return <p className="text-center text-stone-400 py-16">Todavía no hay artículos publicados.</p>;
  }

  const [featured, ...rest] = page === 1 ? posts : [null, ...posts];

  return (
    <div className="space-y-12">
      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-sm transition-all hover:shadow-2xl md:grid-cols-2"
        >
          <Cover post={featured} className="aspect-[1200/630] md:aspect-auto md:min-h-[340px]" />
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <span className="rounded-full bg-[var(--pv-gold)] px-3 py-1 text-white">Último artículo</span>
              {featured.category && <span className="text-[var(--pv-gold)]">{featured.category}</span>}
            </div>
            <h2 className="font-article text-2xl sm:text-3xl font-semibold leading-tight !text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)] transition-colors">
              {featured.title}
            </h2>
            <p className="font-article mt-4 text-base leading-relaxed text-stone-600 line-clamp-3">{summary(featured)}</p>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-stone-500">{formatDate(featured.publishedAt || featured.createdAt)}</span>
              <span className="flex items-center gap-2 font-semibold text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)]">
                Leer artículo <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) =>
            post ? (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <Cover post={post} className="aspect-[1200/630]" />
                <div className="flex flex-1 flex-col p-6">
                  {post.category && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-2">{post.category}</span>
                  )}
                  <h3 className="font-article text-xl font-semibold leading-snug !text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)] transition-colors">
                    {post.title}
                  </h3>
                  <p className="font-article mt-3 text-[15px] leading-relaxed text-stone-600 line-clamp-3">{summary(post)}</p>
                  <div className="mt-auto pt-5 flex items-center justify-between text-xs">
                    <span className="text-stone-500">{formatDate(post.publishedAt || post.createdAt)}</span>
                    <ArrowRight size={16} className="text-[var(--pv-gold)] transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ) : null
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[var(--pv-navy)] disabled:opacity-30 hover:border-[var(--pv-gold)]"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-stone-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[var(--pv-navy)] disabled:opacity-30 hover:border-[var(--pv-gold)]"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
