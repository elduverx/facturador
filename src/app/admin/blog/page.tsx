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
      setMessage('El titulo es obligatorio.');
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
    } catch {
      setMessage('No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Eliminar esta publicacion?')) return;
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
    } catch {
      setMessage('No se pudo subir la imagen.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-stone-500">Publica noticias, links e imagenes</p>
        </div>
        <button onClick={resetForm} className="btn btn-secondary text-xs">Nueva publicacion</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <div className="card !p-3">
          {loading ? (
            <div className="text-sm text-stone-400 text-center py-6">Cargando...</div>
          ) : posts.length === 0 ? (
            <div className="text-sm text-stone-400 text-center py-6">Sin publicaciones</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => selectPost(post)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === post.id
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-stone-200 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{post.title}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      post.status === 'PUBLISHED' ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}>
                      {post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">{post.slug}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-sm font-semibold">Editor</div>
            <div className="flex items-center gap-2">
              <select
                className="form-input text-xs"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
              {selectedId && (
                <button onClick={handleDelete} className="btn btn-ghost text-xs text-red-600">
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block text-xs">Titulo</label>
              <input
                className="form-input text-sm"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titulo de la noticia"
              />
            </div>
            <div>
              <label className="form-label block text-xs">Slug</label>
              <input
                className="form-input text-sm"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="slug-del-post"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label block text-xs">Resumen</label>
            <textarea
              className="form-input text-sm min-h-[70px]"
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Resumen corto para la pagina publica"
            />
          </div>

          <div className="mt-4">
            <label className="form-label block text-xs">Contenido</label>
            <textarea
              className="form-input text-sm min-h-[160px]"
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Escriba el contenido principal..."
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block text-xs">Imagen portada</label>
              <input
                className="form-input text-sm"
                value={form.coverImageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="https://..."
              />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, true);
                  }}
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <label className="form-label block text-xs">Galeria de imagenes</label>
              <textarea
                className="form-input text-sm min-h-[90px]"
                value={form.imageUrlsText}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                placeholder="Una URL por linea"
              />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, false);
                  }}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block text-xs">Links externos</label>
              <textarea
                className="form-input text-sm min-h-[90px]"
                value={form.linkUrlsText}
                onChange={(e) => setForm((prev) => ({ ...prev, linkUrlsText: e.target.value }))}
                placeholder="Un link por linea"
              />
            </div>
            <div>
              <label className="form-label block text-xs">Embeds de video</label>
              <textarea
                className="form-input text-sm min-h-[90px]"
                value={form.embedUrlsText}
                onChange={(e) => setForm((prev) => ({ ...prev, embedUrlsText: e.target.value }))}
                placeholder="Pega URL o enlace embed por linea"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {message && <span className="text-xs text-stone-500">{message}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
