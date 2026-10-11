export const ARTICLE_SECTIONS = [
  { key: 'introduccion', heading: 'Introducción' },
  { key: 'marco_legal', heading: 'Marco legal aplicable' },
  { key: 'requisitos', heading: 'Requisitos' },
  { key: 'procedimiento', heading: 'Procedimiento paso a paso' },
  { key: 'plazos', heading: 'Plazos y aspectos a tener en cuenta' },
  { key: 'conclusion', heading: 'Recomendación profesional' },
] as const;

export type ArticleSectionKey = (typeof ARTICLE_SECTIONS)[number]['key'];

export const ARTICLE_CATEGORIES = [
  'Arraigo',
  'Nacionalidad',
  'Reagrupación familiar',
  'Protección internacional',
  'Estancia por estudios',
  'Autorizaciones de trabajo',
  'Novedades normativas',
] as const;

export const FIRM_SIGNATURE = {
  name: 'PV Abogadas',
  role: 'Abogadas de Extranjería',
};

export const LEGAL_DISCLAIMER =
  'Este artículo tiene carácter meramente informativo y no constituye asesoramiento jurídico. Cada caso requiere un estudio individualizado; la normativa y los criterios administrativos pueden cambiar. Si necesita orientación sobre su situación concreta, reserve una cita con nuestro despacho.';

export type ArticleSection = { key: string; heading: string; body: string };

export type ArticleAttachment = { name: string; url: string; mimeType: string; size: number };

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const normalizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/** Always returns the template sections, in order, filling bodies from the input when present. */
export function normalizeSections(value: unknown): ArticleSection[] {
  const input = Array.isArray(value) ? value : [];
  return ARTICLE_SECTIONS.map(({ key, heading }) => {
    const match = input.find((item) => item && typeof item === 'object' && (item as ArticleSection).key === key) as
      | Partial<ArticleSection>
      | undefined;
    return { key, heading, body: typeof match?.body === 'string' ? match.body.trim() : '' };
  });
}

export function normalizeAttachments(value: unknown): ArticleAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && typeof item.url === 'string' && item.url.startsWith('/uploads/blog/'))
    .map((item) => ({
      name: String(item.name || 'Documento').trim() || 'Documento',
      url: String(item.url),
      mimeType: String(item.mimeType || 'application/octet-stream'),
      size: Number(item.size) || 0,
    }));
}

export function hasSectionContent(sections: unknown) {
  return Array.isArray(sections) && sections.some((section) => (section as ArticleSection)?.body?.trim());
}

/** Plain-text version stored in `content` so newsletter/listings keep working. */
export function composeContent(sections: ArticleSection[]) {
  return sections
    .filter((section) => section.body.trim())
    .map((section) => `${section.heading}\n\n${section.body.trim()}`)
    .join('\n\n');
}

export function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
