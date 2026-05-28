'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Video, 
  Globe, 
  Eye, 
  EyeOff,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const joinLines = (items: string[]) => items.join('\n');
const parseLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    imageUrlsText: '',
    linkUrlsText: '',
    embedUrlsText: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const selectPost = (post: BlogPost) => {
    setSelectedId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImageUrl: post.coverImageUrl || '',
      imageUrlsText: joinLines(post.imageUrls || []),
      linkUrlsText: joinLines(post.linkUrls || []),
      embedUrlsText: joinLines(post.embedUrls || []),
      status: post.status,
    });
    setSlugTouched(true);
    setMessage('');
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImageUrl: '',
      imageUrlsText: '',
      linkUrlsText: '',
      embedUrlsText: '',
      status: 'DRAFT',
    });
    setSlugTouched(false);
    setMessage('');
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setMessage('El título es obligatorio.');
      return;
    }
    setSaving(true);
    setMessage('');
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      imageUrls: parseLines(form.imageUrlsText),
      linkUrls: parseLines(form.linkUrlsText),
      embedUrls: parseLines(form.embedUrlsText),
      status: form.status,
    };

    try {
      const res = await fetch(selectedId ? `/api/admin/blog/${selectedId}` : '/api/admin/blog', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      await loadPosts();
      selectPost(saved);
      setMessage('Guardado correctamente.');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('¿Eliminar esta publicación?')) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/blog/${selectedId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadPosts();
      resetForm();
    } catch {
      setMessage('No se pudo eliminar.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, setAsCover: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = data?.url;
      if (!url) throw new Error();
      setForm((prev) => {
        const updatedImages = prev.imageUrlsText ? `${prev.imageUrlsText}\n${url}` : url;
        return {
          ...prev,
          coverImageUrl: setAsCover ? url : prev.coverImageUrl,
          imageUrlsText: updatedImages,
        };
      });
      setMessage('Imagen subida con éxito.');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('No se pudo subir la imagen.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Anales del Blog</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Publicación de noticias, jurisprudencia y circulares imperiales.</p>
        </div>
        <button onClick={resetForm} className="btn-roman px-6 py-3 text-sm">
          <Plus size={18} /> Nueva Crónica
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Sidebar List */}
        <div className="neo-card !p-4">
          <div className="flex items-center gap-2 mb-6 px-2">
            <FileText size={18} className="text-[var(--pv-gold)]" />
            <h2 className="font-bold font-roman uppercase text-xs tracking-widest text-[var(--pv-ink)]">Listado de Entradas</h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="w-8 h-8 border-3 border-[var(--pv-gold)] border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest animate-pulse">Consultando Archivos...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-[var(--pv-marble)] rounded-2xl border border-dashed border-[var(--pv-gold)]/20">
              <p className="text-sm text-[var(--pv-navy)] opacity-40">Aún no hay crónicas redactadas.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => selectPost(post)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    selectedId === post.id
                      ? 'bg-[var(--pv-gold)] text-white shadow-lg border-[var(--pv-gold)]'
                      : 'bg-white border-white/50 hover:bg-[var(--pv-marble)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className={`text-sm font-bold truncate ${selectedId === post.id ? 'text-white' : 'text-[var(--pv-ink)]'}`}>
                      {post.title}
                    </div>
                    {post.status === 'PUBLISHED' ? <Eye size={14} className={selectedId === post.id ? 'text-white/80' : 'text-emerald-500'} /> : <EyeOff size={14} className={selectedId === post.id ? 'text-white/60' : 'text-stone-400'} />}
                  </div>
                  <div className="flex items-center justify-between">
                     <div className={`text-[9px] font-medium tracking-tighter truncate max-w-[150px] ${selectedId === post.id ? 'text-white/70' : 'text-[var(--pv-navy)] opacity-40'}`}>/{post.slug}</div>
                     <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        post.status === 'PUBLISHED' 
                          ? (selectedId === post.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700') 
                          : (selectedId === post.id ? 'bg-white/10 text-white/60' : 'bg-stone-100 text-stone-500')
                      }`}>
                        {post.status === 'PUBLISHED' ? 'Público' : 'Borrador'}
                      </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="neo-card !p-4 lg:!p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
             <div className="flex items-center gap-2 bg-[var(--pv-marble)] px-4 py-2 rounded-xl border border-white/50">
               <span className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Estado</span>
               <select
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-[var(--pv-ink)] cursor-pointer"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                </select>
             </div>
             {selectedId && (
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar Crónica">
                  <Trash2 size={20} />
                </button>
              )}
          </div>

          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-[var(--pv-navy)] text-white rounded-2xl shadow-lg">
               <ImageIcon size={24} />
            </div>
            <div>
               <h3 className="text-xl font-bold font-roman uppercase text-[var(--pv-ink)]">Scriptorium</h3>
               <p className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest">Editor de Contenidos</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Título de la Crónica</label>
                <input
                  className="neo-input"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej: Nuevos requisitos para el Arraigo"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Dirección URL (Slug)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pv-navy)] opacity-30 text-xs font-bold">/blog/</span>
                  <input
                    className="neo-input pl-16"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Exordio (Resumen)</label>
              <textarea
                className="neo-input min-h-[80px] text-sm leading-relaxed"
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Breve introducción para captar el interés de los ciudadanos..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4">Cuerpo del Mensaje</label>
              <textarea
                className="neo-input min-h-[300px] text-sm leading-relaxed font-serif p-8 bg-white"
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Escriba aquí la crónica completa de los hechos o la base legal..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-[var(--pv-marble)]">
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4 flex items-center gap-2">
                      <ImageIcon size={12} /> Imagen de Portada
                    </label>
                    <input
                      className="neo-input !py-2.5 !text-xs !bg-[var(--pv-marble)]"
                      value={form.coverImageUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                      placeholder="URL de la imagen"
                    />
                    <div className="flex justify-end pt-1">
                      <label className="cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase text-[var(--pv-gold)] hover:brightness-110">
                        <Upload size={12} /> Subir Archivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, true);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4 flex items-center gap-2">
                       <ImageIcon size={12} /> Galería de Imágenes
                    </label>
                    <textarea
                      className="neo-input !bg-[var(--pv-marble)] min-h-[100px] !text-[10px] font-mono"
                      value={form.imageUrlsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                      placeholder="Una URL por línea"
                    />
                 </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4 flex items-center gap-2">
                    <LinkIcon size={12} /> Enlaces Externos
                  </label>
                  <textarea
                    className="neo-input !bg-[var(--pv-marble)] min-h-[100px] !text-[10px] font-mono"
                    value={form.linkUrlsText}
                    onChange={(e) => setForm((prev) => ({ ...prev, linkUrlsText: e.target.value }))}
                    placeholder="Un enlace por línea"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--pv-gold)] uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Video size={12} /> Medios Audiovisuales (Embeds)
                  </label>
                  <textarea
                    className="neo-input !bg-[var(--pv-marble)] min-h-[100px] !text-[10px] font-mono"
                    value={form.embedUrlsText}
                    onChange={(e) => setForm((prev) => ({ ...prev, embedUrlsText: e.target.value }))}
                    placeholder="Pega códigos embed o URLs de video"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-10">
              <button onClick={handleSave} disabled={saving} className="btn-roman flex-1 py-4 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--pv-gold)]/20">
                {saving ? 'Codificando...' : <><Save size={20} /> Sellar y Guardar</>}
              </button>
              {message && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white border-2 border-[var(--pv-gold)] px-8 py-3 rounded-2xl shadow-2xl animate-fade-in z-50">
                   {message.includes('No') ? <AlertCircle className="text-red-500" /> : <CheckCircle2 className="text-emerald-500" />}
                   <span className="text-sm font-bold text-[var(--pv-ink)]">{message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--pv-gold);
          border-radius: 10px;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
