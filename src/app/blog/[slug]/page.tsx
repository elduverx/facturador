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
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
  });
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-xs text-stone-400">{formatDate(post.publishedAt || post.createdAt)}</div>
          <h1 className="text-2xl font-semibold mt-2">{post.title}</h1>
          {post.excerpt && <p className="text-sm text-stone-500 mt-2">{post.excerpt}</p>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
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
      </main>
    </div>
  );
}
