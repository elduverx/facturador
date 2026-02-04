'use client';

import { useEffect, useState } from 'react';
import { NewsletterSignup } from '@/components/public/NewsletterSignup';

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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-ES', { dateStyle: 'medium' });

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog?limit=5')
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-3xl mx-auto px-4 pb-12">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Noticias y actualizaciones</h2>
              <p className="text-sm text-stone-500">Politica, novedades y comunicados del consultorio</p>
            </div>
            <a href="/blog" className="text-xs text-teal-700 hover:text-teal-800">Ver todo</a>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-stone-400">Cargando noticias...</div>
          ) : posts.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400">Aun no hay publicaciones.</div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="border border-stone-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm text-stone-400">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </div>
                    <a href={`/blog/${post.slug}`} className="text-xs text-teal-700 hover:text-teal-800">
                      Leer mas
                    </a>
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-stone-600 mt-2">{post.excerpt}</p>}
                  {post.coverImageUrl && (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full rounded-lg mt-3 object-cover max-h-[260px]"
                    />
                  )}
                  {post.imageUrls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {post.imageUrls.slice(0, 4).map((url) => (
                        <img key={url} src={url} alt={post.title} className="rounded-lg object-cover h-32 w-full" />
                      ))}
                    </div>
                  )}
                  {post.embedUrls?.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {post.embedUrls.slice(0, 2).map((url) => (
                        <div key={url} className="aspect-video w-full rounded-lg overflow-hidden border border-stone-200">
                          <iframe
                            src={getEmbedUrl(url)}
                            title={post.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {post.linkUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.linkUrls.slice(0, 3).map((url) => (
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
              ))}
            </div>
          )}
        </div>

        <NewsletterSignup />
      </div>
    </section>
  );
}
