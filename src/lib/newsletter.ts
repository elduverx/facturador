import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { newsletterEmail } from '@/lib/email-templates';

const getAppUrl = () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

type NewsletterPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  linkUrls?: string[];
  embedUrls?: string[];
};

export async function sendNewsletterForPost(post: NewsletterPost) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: 'SUBSCRIBED' },
  });

  if (subscribers.length === 0) {
    return { sent: 0, total: 0 };
  }

  const settings = await prisma.officeSettings.findUnique({ where: { id: 'default' } });
  const firmName = settings?.firmName || 'PV Abogadas';
  const appUrl = getAppUrl();
  const postUrl = `${appUrl}/blog/${post.slug}`;

  const chunkSize = 10;
  let sent = 0;

  for (let i = 0; i < subscribers.length; i += chunkSize) {
    const chunk = subscribers.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map((subscriber) => {
        const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
        return sendEmail({
          to: subscriber.email,
          subject: `Nuevo articulo: ${post.title} - ${firmName}`,
          html: newsletterEmail({
            post,
            firmName,
            postUrl,
            unsubscribeUrl,
          }),
        });
      })
    );
    results.forEach((result) => {
      if (result.status === 'fulfilled') sent += 1;
    });
  }

  return { sent, total: subscribers.length };
}
