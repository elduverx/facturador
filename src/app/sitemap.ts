import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pvabogadas.es';

  // Get static routes
  const routes = [
    '',
    '/reservar',
    '/portal',
    '/blog',
    '/contacto',
    '/faq',
    '/aviso-legal',
    '/politica-privacidad',
    '/cookies'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/reservar' ? 0.9 : 0.8,
  }));

  // Fetch dynamic blog posts
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    const blogRoutes = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...routes, ...blogRoutes];
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error);
    return routes;
  }
}
