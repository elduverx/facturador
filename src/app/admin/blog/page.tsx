'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Send,
  Paperclip,
  Image as ImageIcon,
  Save,
  Globe,
  Trash2,
  X,
  Sparkles,
  ExternalLink,
  PenLine,
  Eye,
} from 'lucide-react';
import ArticleBody from '@/components/blog/ArticleBody';
import { ARTICLE_CATEGORIES, normalizeSections, type ArticleAttachment, type ArticleSection } from '@/lib/blog-template';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  sections: ArticleSection[] | null;
  attachments: ArticleAttachment[] | null;
  coverImageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED';
}

type Article = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  sections: ArticleSection[];
  attachments: ArticleAttachment[];
  coverImageUrl: string;
  status: 'DRAFT' | 'PUBLISHED';
};

// `local` messages are UI notes (greetings, confirmations) and are never sent to Claude.
type ChatMessage = { role: 'user' | 'assistant'; content: string; suggestions?: string[]; local?: boolean };

const emptyArticle = (): Article => ({
  id: null,
  slug: '',
  title: '',
  excerpt: '',
  category: '',
  sections: normalizeSections([]),
  attachments: [],
  coverImageUrl: '',
  status: 'DRAFT',
});

const greeting = (): ChatMessage => ({
  role: 'assistant',
  local: true,
  content:
    'Hola. Dígame sobre qué quiere publicar y redactaré el artículo con el formato del despacho. Después puede pedirme cambios, una imagen de portada o adjuntar documentos.',
  suggestions: [
    'Artículo sobre el arraigo sociolaboral',
    'Novedades del nuevo Reglamento de Extranjería',
    'Cómo pedir la nacionalidad por residencia',
  ],
});

// Legacy posts only have free text: keep it as the introduction so nothing is lost.
const articleFromPost = (post: BlogPost): Article => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt || '',
  category: post.category || '',
  sections:
    Array.isArray(post.sections) && post.sections.length
      ? normalizeSections(post.sections)
      : normalizeSections([{ key: 'introduccion', heading: '', body: post.content || '' }]),
  attachments: Array.isArray(post.attachments) ? post.attachments : [],
  coverImageUrl: post.coverImageUrl || '',
  status: post.status,
});

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [article, setArticle] = useState<Article>(emptyArticle);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting()]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasArticle = Boolean(article.title || article.sections.some((section) => section.body));

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    }
  };

  const note = (content: string, suggestions?: string[]) =>
    setMessages((prev) => [...prev, { role: 'assistant', content, suggestions, local: true }]);

  const updateArticle = (patch: Partial<Article>) => {
    setArticle((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const updateSection = (key: string, body: string) => {
    setArticle((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.key === key ? { ...section, body } : section)),
    }));
    setDirty(true);
  };

  const startNew = () => {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Empezar un artículo nuevo?')) return;
    setArticle(emptyArticle());
    setMessages([greeting()]);
    setDirty(false);
  };

  const openPost = (id: string) => {
    const post = posts.find((item) => item.id === id);
    if (!post) return;
    if (dirty && !confirm('Hay cambios sin guardar. ¿Abrir otro artículo?')) return;
    setArticle(articleFromPost(post));
    setMessages([
      {
        role: 'assistant',
        local: true,
        content: `He abierto «${post.title}». ¿Qué quiere cambiar?`,
        suggestions: ['Revísalo y mejora la redacción', 'Crea una imagen de portada', 'Hazlo más breve'],
      },
    ]);
    setDirty(false);
  };

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;

    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(history);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/admin/blog/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.filter((m) => !m.local).map(({ role, content }) => ({ role, content })),
          article,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error desconocido');

      if (data.article || data.coverImageUrl) {
        updateArticle({
          ...(data.article ?? {}),
          ...(data.coverImageUrl ? { coverImageUrl: data.coverImageUrl } : {}),
        });
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, suggestions: data.suggestions }]);
    } catch (error) {
      note(`No he podido responder: ${error instanceof Error ? error.message : 'error desconocido'}.`, [content]);
    } finally {
      setThinking(false);
    }
  };

  const save = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!article.title.trim()) {
      note('Todavía no hay artículo que guardar. Cuénteme primero sobre qué quiere escribir.');
      return;
    }
    if (status === 'PUBLISHED') {
      const body = (key: string) => article.sections.find((section) => section.key === key)?.body.trim();
      if (!article.excerpt.trim() || !body('introduccion') || !body('conclusion')) {
        note('Antes de publicar faltan el resumen, la introducción o la recomendación profesional.', [
          'Completa las partes que faltan',
        ]);
        return;
      }
      const pending = JSON.stringify(article).match(/a verificar/gi)?.length ?? 0;
      if (
        pending &&
        !confirm(`El artículo tiene ${pending} dato(s) marcados como "(a verificar)" que verán los lectores. ¿Publicar de todos modos?`)
      ) {
        note(`Hay ${pending} dato(s) marcados como "(a verificar)". Revíselos antes de publicar.`, [
          'Muéstrame los datos marcados como a verificar',
        ]);
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(article.id ? `/api/admin/blog/${article.id}` : '/api/admin/blog', {
        method: article.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          sections: article.sections,
          attachments: article.attachments,
          coverImageUrl: article.coverImageUrl,
          status,
        }),
      });
      if (!res.ok) throw new Error();
      const saved: BlogPost = await res.json();
      setArticle(articleFromPost(saved));
      setDirty(false);
      await loadPosts();
      note(status === 'PUBLISHED' ? `Publicado en /blog/${saved.slug}.` : 'Guardado como borrador.');
    } catch {
      note('No se pudo guardar el artículo. Inténtelo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!article.id || !confirm('¿Eliminar este artículo?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/${article.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadPosts();
      setArticle(emptyArticle());
      setMessages([greeting()]);
      setDirty(false);
    } catch {
      note('No se pudo eliminar el artículo.');
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File, kind: 'image' | 'attachment') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data?.url) throw new Error(data?.error || 'error al subir');
    return data;
  };

  const attachFiles = async (files: FileList) => {
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const attachment = (await upload(file, 'attachment')) as ArticleAttachment;
        setArticle((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }));
        setDirty(true);
        note(`Documento «${attachment.name}» adjuntado. Aparecerá como descargable al final del artículo.`);
      } catch (error) {
        note(`No se pudo adjuntar «${file.name}»: ${error instanceof Error ? error.message : 'error'}.`);
      }
    }
    setBusy(false);
  };

  const uploadCover = async (file: File) => {
    setBusy(true);
    try {
      const { url } = await upload(file, 'image');
      updateArticle({ coverImageUrl: url });
      note('Imagen de portada actualizada.');
    } catch {
      note('No se pudo subir la imagen de portada.');
    } finally {
      setBusy(false);
    }
  };

  const lastSuggestionsIndex = messages.map((m) => Boolean(m.suggestions?.length)).lastIndexOf(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-roman uppercase text-[var(--pv-ink)] tracking-tight">Artículos</h1>
          <p className="text-sm text-[var(--pv-navy)] opacity-60">Pídale a Claude el artículo que quiere publicar.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="neo-input !py-2.5 !text-sm max-w-[260px]"
            value={article.id ?? ''}
            onChange={(e) => openPost(e.target.value)}
          >
            <option value="" disabled>
              Abrir artículo existente…
            </option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.status === 'PUBLISHED' ? '● ' : '○ '}
                {post.title}
              </option>
            ))}
          </select>
          <button onClick={startNew} className="btn-roman px-5 py-2.5 text-sm">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Chat */}
        <div className="neo-card !p-0 flex flex-col h-[78vh] overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-[var(--pv-navy)] text-white rounded-br-sm'
                      : 'bg-white text-[var(--pv-ink)] border border-stone-200 rounded-bl-sm'
                  }`}
                >
                  {message.content}
                </div>
                {index === lastSuggestionsIndex && !thinking && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions!.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[var(--pv-gold)]/50 text-[var(--pv-ink)] bg-white hover:bg-[var(--pv-gold)] hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2 text-xs text-[var(--pv-navy)] opacity-60">
                <Sparkles size={14} className="animate-pulse text-[var(--pv-gold)]" /> Claude está redactando…
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 bg-[var(--pv-marble)] p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className={`chat-action ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                <Paperclip size={14} /> Adjuntar documento
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) attachFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className={`chat-action ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon size={14} /> Subir portada
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCover(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="flex-1" />
              <button onClick={() => save('DRAFT')} disabled={busy || thinking} className="chat-action">
                <Save size={14} /> Guardar borrador
              </button>
              <button
                onClick={() => save('PUBLISHED')}
                disabled={busy || thinking}
                className="chat-action !bg-[var(--pv-gold)] !text-white !border-[var(--pv-gold)]"
              >
                <Globe size={14} /> Publicar
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                className="neo-input flex-1 !py-3 text-sm resize-none min-h-[48px] max-h-40"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Escriba aquí… (Mayús+Intro para nueva línea)"
              />
              <button type="submit" disabled={thinking || !input.trim()} className="btn-roman !p-3.5" title="Enviar">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Live preview */}
        <div className="neo-card !p-0 h-[78vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-stone-200">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span
                className={`px-2 py-0.5 rounded ${
                  article.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {article.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
              </span>
              {dirty && <span className="text-amber-600">Cambios sin guardar</span>}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex rounded-lg bg-[var(--pv-marble)] p-0.5 mr-1">
                {[
                  { value: false, label: 'Vista previa', icon: Eye },
                  { value: true, label: 'Editar a mano', icon: PenLine },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setEditing(value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      editing === value ? 'bg-white text-[var(--pv-ink)] shadow-sm' : 'text-[var(--pv-navy)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
              {article.id && article.status === 'PUBLISHED' && (
                <a
                  href={`/blog/${article.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-[var(--pv-navy)] hover:bg-[var(--pv-marble)] rounded-lg"
                  title="Ver en la web"
                >
                  <ExternalLink size={16} />
                </a>
              )}
              {article.id && (
                <button onClick={remove} disabled={busy} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8">
            {editing ? (
              <div className="space-y-5">
                <p className="text-xs text-stone-500 bg-[var(--pv-marble)] rounded-lg px-3 py-2">
                  Cambios manuales sin coste de IA. Formato: línea en blanco entre párrafos · «- » para viñetas · «1. » para pasos ·
                  una línea corta acabada en «:» para un subtítulo.
                </p>
                <div className="space-y-1">
                  <label className="manual-label">Título</label>
                  <input
                    className="neo-input font-article !text-lg font-semibold"
                    value={article.title}
                    onChange={(e) => updateArticle({ title: e.target.value })}
                    placeholder="Título del artículo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="manual-label">Resumen</label>
                  <textarea
                    className="neo-input text-sm leading-relaxed [field-sizing:content] min-h-[70px]"
                    value={article.excerpt}
                    onChange={(e) => updateArticle({ excerpt: e.target.value })}
                    placeholder="Una o dos frases que resuman el artículo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="manual-label">Categoría</label>
                  <select className="neo-input text-sm" value={article.category} onChange={(e) => updateArticle({ category: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {ARTICLE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    {article.category && !(ARTICLE_CATEGORIES as readonly string[]).includes(article.category) && (
                      <option value={article.category}>{article.category}</option>
                    )}
                  </select>
                </div>
                {article.coverImageUrl && (
                  <div className="space-y-1">
                    <label className="manual-label">Portada</label>
                    <div className="relative">
                      <img src={article.coverImageUrl} alt="" className="w-full rounded-lg object-cover max-h-[180px]" />
                      <button
                        onClick={() => updateArticle({ coverImageUrl: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 shadow"
                        title="Quitar portada"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {article.sections.map((section, index) => (
                  <div key={section.key} className="space-y-1">
                    <label className="manual-label">
                      {String(index + 1).padStart(2, '0')} · {section.heading}
                    </label>
                    <textarea
                      className="neo-input font-article text-[15px] leading-relaxed [field-sizing:content] min-h-[120px]"
                      value={section.body}
                      onChange={(e) => updateSection(section.key, e.target.value)}
                    />
                  </div>
                ))}
                {article.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="manual-label">Documentos descargables</label>
                    {article.attachments.map((file) => (
                      <div key={file.url} className="flex items-center gap-2 bg-[var(--pv-marble)] rounded-lg px-3 py-2">
                        <Paperclip size={14} className="text-[var(--pv-gold)] shrink-0" />
                        <input
                          className="flex-1 bg-transparent outline-none text-sm"
                          value={file.name}
                          onChange={(e) =>
                            updateArticle({
                              attachments: article.attachments.map((item) =>
                                item.url === file.url ? { ...item, name: e.target.value } : item
                              ),
                            })
                          }
                        />
                        <button
                          onClick={() => updateArticle({ attachments: article.attachments.filter((item) => item.url !== file.url) })}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Quitar documento"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : hasArticle ? (
              <>
                {article.coverImageUrl && (
                  <div className="relative mb-6">
                    <img src={article.coverImageUrl} alt={article.title} className="w-full rounded-lg object-cover max-h-[300px]" />
                    <button
                      onClick={() => updateArticle({ coverImageUrl: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 shadow"
                      title="Quitar portada"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <h2 className="font-article text-3xl font-semibold text-stone-900 mb-2">{article.title}</h2>
                {article.excerpt && <p className="text-sm text-stone-500 mb-8">{article.excerpt}</p>}
                <ArticleBody content="" sections={article.sections} attachments={article.attachments} />
                {article.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-dashed border-stone-200 flex flex-wrap gap-2">
                    {article.attachments.map((file) => (
                      <span key={file.url} className="flex items-center gap-1 text-xs bg-[var(--pv-marble)] rounded-full pl-3 pr-1 py-1">
                        {file.name}
                        <button
                          onClick={() => updateArticle({ attachments: article.attachments.filter((item) => item.url !== file.url) })}
                          className="p-0.5 text-red-500 hover:bg-red-50 rounded-full"
                          title="Quitar documento"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-[var(--pv-navy)] opacity-40">
                <Sparkles size={28} />
                <p className="text-sm max-w-xs">Aquí verá el artículo tal como quedará publicado mientras lo redacta con Claude.</p>
                <button onClick={() => setEditing(true)} className="text-xs underline underline-offset-4 hover:opacity-100">
                  o escríbalo a mano
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.manual-label) {
          display: block;
          margin-left: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--pv-gold);
        }
        :global(.chat-action) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid rgba(200, 170, 106, 0.5);
          background: white;
          color: var(--pv-ink);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.2s;
        }
        :global(.chat-action:hover) {
          filter: brightness(0.96);
        }
        :global(.chat-action:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
