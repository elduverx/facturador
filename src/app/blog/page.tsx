import { BlogList } from '@/components/blog/BlogList';
import { NewsletterSignup } from '@/components/public/NewsletterSignup';

export default function BlogPage() {
  return (
    <div className="pv-page">
      <header className="pv-dark-panel border-b border-[rgba(200,170,106,0.42)]">
        <div className="pv-shell py-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-legal text-xs uppercase tracking-[0.24em] text-[#c8aa6a]">Actualidad legal</p>
            <h1 className="font-legal text-3xl text-[#f8f1df] mt-1">Blog del consultorio</h1>
          </div>
          <a href="/" className="btn btn-secondary">Inicio</a>
        </div>
      </header>
      <main className="pv-shell py-8">
        <div className="pv-frame pv-paper p-5 sm:p-8 space-y-6">
          <BlogList />
          <NewsletterSignup />
        </div>
      </main>
    </div>
  );
}
