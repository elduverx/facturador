'use client';

import { useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  linkUrls: string[];
  embedUrls: string[];
  publishedAt: string | null;
  createdAt: string;
}

interface BlogResponse {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 2;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-ES', { dateStyle: 'medium' });

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

const getPreviewText = (post: BlogPost) => {
  if (post.excerpt) return post.excerpt;
  if (!post.content) return '';
  const trimmed = post.content.replace(/\s+/g, ' ').trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}...` : trimmed;
};

export function HomeBlogFeed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

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
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return <div className="card text-center text-sm text-stone-400 py-10">Cargando publicaciones...</div>;
  }

  if (posts.length === 0) {
    return <div className="card text-center text-sm text-stone-400 py-10">No hay publicaciones disponibles.</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const previewImage = post.coverImageUrl || post.imageUrls?.[0] || null;
        const shouldShowEmbed = !previewImage && post.embedUrls?.length > 0;
        const previewText = getPreviewText(post);
        return (
          <article key={post.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-stone-400">
                {formatDate(post.publishedAt || post.createdAt)}
              </div>
              <a href={`/blog/${post.slug}`} className="text-xs text-teal-700 hover:text-teal-800">
                Ver detalle
              </a>
            </div>
            <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
            {previewText && <p className="text-sm text-stone-600 mt-2">{previewText}</p>}
            {previewImage && (
              <img
                src={previewImage}
                alt={post.title}
                className="w-full rounded-lg mt-3 object-cover max-h-48"
              />
            )}
            {shouldShowEmbed && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-stone-200 mt-3">
                <iframe
                  src={getEmbedUrl(post.embedUrls[0])}
                  title={post.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {post.linkUrls?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.linkUrls.slice(0, 2).map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-700 hover:text-teal-800 underline"
                  >
                    {url}
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
