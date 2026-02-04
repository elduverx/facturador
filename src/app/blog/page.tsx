import { BlogList } from '@/components/blog/BlogList';
import { NewsletterSignup } from '@/components/public/NewsletterSignup';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Blog del consultorio</h1>
          <p className="text-sm text-stone-500">Noticias, politica y novedades</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <BlogList />
          <NewsletterSignup />
        </div>
      </main>
    </div>
  );
}
