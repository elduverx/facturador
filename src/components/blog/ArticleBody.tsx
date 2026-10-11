import Link from 'next/link';
import { Download, FileSpreadsheet, FileText, FileImage, Scale, ArrowRight } from 'lucide-react';
import {
  FIRM_SIGNATURE,
  LEGAL_DISCLAIMER,
  formatFileSize,
  hasSectionContent,
  type ArticleAttachment,
  type ArticleSection,
} from '@/lib/blog-template';

interface ArticleBodyProps {
  content: string;
  sections?: unknown;
  attachments?: unknown;
}

export function filledSections(sections: unknown): ArticleSection[] {
  return hasSectionContent(sections) ? (sections as ArticleSection[]).filter((section) => section.body?.trim()) : [];
}

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: Array<{ n: number; text: string }> };

// Bolds a short lead-in ("Requisito: ..." or "Paso. ...") so lists scan easily.
function withLead(text: string, separators = ':') {
  const match = text.match(new RegExp(`^(.{3,70}?[${separators}])\\s+(.+)$`));
  if (!match) return text;
  return (
    <>
      <strong className="font-semibold text-[var(--pv-navy)]">{match[1]}</strong> {match[2]}
    </>
  );
}

// Splits a section body into paragraphs, subheadings ("Texto:"), "- " lists and "1. " steps. Plain text only, never raw HTML.
function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      const text = paragraph.join(' ');
      blocks.push(text.length <= 60 && text.endsWith(':') ? { type: 'h3', text: text.slice(0, -1) } : { type: 'p', text });
    }
    paragraph = [];
  };

  const pushBullet = (item: string) => {
    flushParagraph();
    const last = blocks[blocks.length - 1];
    if (last?.type === 'ul') last.items.push(item);
    else blocks.push({ type: 'ul', items: [item] });
  };

  const pushStep = (n: number, text: string) => {
    flushParagraph();
    const last = blocks[blocks.length - 1];
    if (last?.type === 'ol') last.items.push({ n, text });
    else blocks.push({ type: 'ol', items: [{ n, text }] });
  };

  // A plain line right after a list item (no blank line in between) continues that item.
  const appendToLastItem = (line: string) => {
    const last = blocks[blocks.length - 1];
    if (last?.type === 'ul') last.items[last.items.length - 1] += ` ${line}`;
    else if (last?.type === 'ol') last.items[last.items.length - 1].text += ` ${line}`;
  };

  let inItem = false;

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    const step = line.match(/^(\d{1,2})[.)]\s+(.*)$/);
    if (bullet) pushBullet(bullet[1]);
    else if (step) pushStep(Number(step[1]), step[2]);
    else if (line && inItem) appendToLastItem(line);
    else if (!line) flushParagraph();
    else paragraph.push(line);
    inItem = Boolean(bullet || step || (line && inItem));
  }
  flushParagraph();
  return blocks;
}

function renderBody(body: string, dark = false) {
  return parseBlocks(body).map((block, index) => {
    if (block.type === 'p') return <p key={index}>{block.text}</p>;
    if (block.type === 'h3')
      return (
        <h3 key={index} className={`font-article !mt-9 text-xl font-semibold ${dark ? '!text-white' : '!text-[var(--pv-navy)]'}`}>
          {block.text}
        </h3>
      );
    if (block.type === 'ul')
      return (
        <ul key={index} className="space-y-3 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--pv-gold)]" aria-hidden />
              <span>{dark ? item : withLead(item)}</span>
            </li>
          ))}
        </ul>
      );
    return (
      <ol key={index} className="relative space-y-6 !my-8">
        {block.items.map((item, i) => (
          <li key={item.n} className="relative flex gap-5">
            {i < block.items.length - 1 && (
              <span className="absolute left-[17px] top-10 bottom-[-24px] w-px bg-[var(--pv-gold)]/30" aria-hidden />
            )}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pv-navy)] font-sans text-sm font-bold text-[var(--pv-gold)] tabular-nums">
              {item.n}
            </span>
            <span className="pt-1">{dark ? item.text : withLead(item.text, ':.')}</span>
          </li>
        ))}
      </ol>
    );
  });
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileText;
}

export default function ArticleBody({ content, sections, attachments }: ArticleBodyProps) {
  const items = filledSections(sections);
  const files = Array.isArray(attachments) ? (attachments as ArticleAttachment[]) : [];

  return (
    <div className="font-article">
      <div className="space-y-14">
        {items.length > 0 ? (
          items.map((section, index) => {
            const isConclusion = section.key === 'conclusion';
            const body = (
              <div className="space-y-5 text-[17px] sm:text-[18px] leading-[1.8] text-[#2b3440]">{renderBody(section.body)}</div>
            );

            if (isConclusion) {
              return (
                <section key={section.key} id={section.key} className="scroll-mt-28">
                  <div className="relative overflow-hidden rounded-2xl bg-[var(--pv-navy)] p-7 sm:p-10 text-white shadow-xl">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--pv-gold)]/15 blur-3xl" aria-hidden />
                    <div className="relative flex items-center gap-3 mb-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pv-gold)]/50 text-[var(--pv-gold)]">
                        <Scale size={18} />
                      </span>
                      <h2 className="font-article text-2xl sm:text-[28px] font-semibold !text-white">{section.heading}</h2>
                    </div>
                    <div className="relative space-y-5 text-[17px] sm:text-[18px] leading-[1.8] text-white/85">
                      {renderBody(section.body, true)}
                    </div>
                  </div>
                </section>
              );
            }

            return (
              <section key={section.key} id={section.key} className="scroll-mt-28">
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="font-roman text-sm font-bold text-[var(--pv-gold)] tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-article text-[26px] sm:text-[32px] font-semibold leading-tight !text-[var(--pv-navy)]">
                    {section.heading}
                  </h2>
                </div>
                {body}
              </section>
            );
          })
        ) : content ? (
          <div className="text-[17px] sm:text-[18px] leading-[1.8] text-[#2b3440] whitespace-pre-wrap">{content}</div>
        ) : null}

        {files.length > 0 && (
          <section id="documentos" className="scroll-mt-28">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-roman text-sm font-bold text-[var(--pv-gold)]">
                <Download size={16} className="inline -mt-1" />
              </span>
              <h2 className="font-article text-[26px] sm:text-[32px] font-semibold leading-tight !text-[var(--pv-navy)]">
                Documentos descargables
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {files.map((file) => {
                const Icon = fileIcon(file.mimeType);
                const ext = file.url.split('.').pop()?.toUpperCase();
                return (
                  <a
                    key={file.url}
                    href={file.url}
                    download
                    className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 font-sans transition-all hover:-translate-y-0.5 hover:border-[var(--pv-gold)] hover:shadow-lg"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--pv-marble)] text-[var(--pv-navy)] group-hover:bg-[var(--pv-gold)] group-hover:text-white transition-colors">
                      <Icon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--pv-navy)]">{file.name}</span>
                      <span className="block text-xs text-stone-500">
                        {ext} {file.size ? `· ${formatFileSize(file.size)}` : ''}
                      </span>
                    </span>
                    <Download size={18} className="shrink-0 text-[var(--pv-gold)]" />
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Firm signature */}
      <footer className="mt-16 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-[var(--pv-gold)]/30 bg-white p-6 sm:p-7">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--pv-gold)] shadow">
            <img src="/logopv.jpeg" alt={FIRM_SIGNATURE.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--pv-gold)]">Escrito por</p>
            <p className="font-roman text-lg font-bold uppercase text-[var(--pv-navy)]">{FIRM_SIGNATURE.name}</p>
            <p className="text-sm text-stone-500">{FIRM_SIGNATURE.role} · Valencia</p>
          </div>
          <Link href="/reservar" className="btn-roman !px-5 !py-3 text-sm shrink-0">
            Consultar mi caso <ArrowRight size={16} />
          </Link>
        </div>
        <p className="mt-6 border-l-2 border-stone-200 pl-4 text-xs leading-relaxed text-stone-500 italic">{LEGAL_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
