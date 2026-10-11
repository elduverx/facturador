import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { BlogList } from '@/components/blog/BlogList';
import { NewsletterSignup } from '@/components/public/NewsletterSignup';
import { SiteHeader } from '@/components/public/SiteHeader';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Blog de extranjería | PV Abogadas',
  description: 'Artículos y novedades sobre extranjería, nacionalidad, arraigo y reagrupación familiar, explicados por abogadas especialistas.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-[72px]">
        <section className="relative bg-[var(--pv-navy)] py-16 sm:py-24 overflow-hidden">
          <div className="absolute -left-40 top-0 w-96 h-96 bg-[var(--pv-gold)]/20 rounded-full blur-[120px]" aria-hidden />
          <div className="absolute -right-40 bottom-0 w-96 h-96 bg-[var(--pv-gold)]/10 rounded-full blur-[120px]" aria-hidden />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--pv-gold)]/40 text-[var(--pv-gold)] text-[10px] font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-md bg-white/5">
              <BookOpen size={14} /> Actualidad legal
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold !text-white font-roman uppercase tracking-tight mb-4">
              Blog de <span className="text-[var(--pv-gold)]">extranjería</span>
            </h1>
            <p className="text-base sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
              Cambios normativos, trámites y criterios administrativos explicados con claridad por nuestras abogadas.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <BlogList />
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-20 w-full">
          <NewsletterSignup />
        </section>
      </main>
      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}
