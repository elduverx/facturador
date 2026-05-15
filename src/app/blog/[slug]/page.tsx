import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  linkUrls: string[];
  embedUrls: string[];
  publishedAt: Date | null;
  createdAt: Date;
}

const formatDate = (value: string | Date) =>
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

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
    });
  } catch (error) {
    console.error('Error cargando post publicado:', error);
    return null;
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  return (
    <div className="pv-page">
      <header className="pv-dark-panel border-b border-[rgba(200,170,106,0.42)]">
        <div className="pv-shell py-6">
          <a href="/blog" className="text-xs uppercase tracking-[0.18em] text-[#c8aa6a] hover:text-white">Volver al blog</a>
          <div className="text-xs text-[#d8c7a0] mt-4">{formatDate(post.publishedAt || post.createdAt)}</div>
          <h1 className="font-legal text-3xl sm:text-5xl text-[#f8f1df] mt-2">{post.title}</h1>
          {post.excerpt && <p className="text-sm text-[#d8c7a0] mt-3 max-w-2xl">{post.excerpt}</p>}
        </div>
      </header>

      <main className="pv-shell py-8">
        <article className="pv-frame pv-paper p-5 sm:p-8">
        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt={post.title} className="w-full rounded-lg mb-6 object-cover max-h-[360px]" />
        )}
        {post.content && (
          <div className="text-sm text-stone-700 whitespace-pre-wrap">{post.content}</div>
        )}
        {post.embedUrls?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {post.embedUrls.map((url) => (
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
        {post.imageUrls?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {post.imageUrls.map((url) => (
              <img key={url} src={url} alt={post.title} className="rounded-lg object-cover h-36 w-full" />
            ))}
          </div>
        )}
        {post.linkUrls?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.linkUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-teal-700 hover:text-teal-800 underline">
                {url}
              </a>
            ))}
          </div>
        )}
        </article>
      </main>
    </div>
  );
}
