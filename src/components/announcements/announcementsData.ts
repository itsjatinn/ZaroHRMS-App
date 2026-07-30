import type { AttachmentType, ReactionKind } from '../../api/announcements';

// Shared palette, copy and formatting for the announcements screen. Values
// mirror the web panel's employee announcements page so the two products read
// as one system.

export const BRAND_PRIMARY = '#0D3749';
export const BRAND_SECONDARY = '#F9D36B';
export const brandAlpha = (opacity: number) => `rgba(13, 55, 73, ${opacity})`;

/** Unread accent + featured/gold accent, matching the web card states. */
export const UNREAD_ACCENT = '#5B5AB8';
export const GOLD_ACCENT = '#A37526';
export const ACK_GREEN = '#3F7B58';

export type FilterValue = 'all' | 'unread' | 'read';

export const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

/** Reaction enum (server-side) + emoji + display order. */
export const REACTIONS: { key: ReactionKind; emoji: string }[] = [
  { key: 'LIKE', emoji: '👍' },
  { key: 'CLAP', emoji: '👏' },
  { key: 'PARTY', emoji: '🎉' },
  { key: 'HEART', emoji: '❤️' },
  { key: 'SMILE', emoji: '😊' },
];

/** Per-type attachment tint — the web's .anc__file-icon--* rules. */
export const ATTACHMENT_STYLE: Record<
  AttachmentType,
  { bg: string; color: string }
> = {
  pdf: { bg: 'rgba(176, 74, 42, 0.14)', color: '#B04A2A' },
  docx: { bg: 'rgba(91, 90, 184, 0.14)', color: '#5B5AB8' },
  xlsx: { bg: 'rgba(63, 123, 88, 0.14)', color: '#3F7B58' },
  pptx: { bg: 'rgba(212, 162, 74, 0.18)', color: '#A37526' },
  zip: { bg: 'rgba(13, 55, 73, 0.08)', color: BRAND_PRIMARY },
  other: { bg: 'rgba(13, 55, 73, 0.08)', color: BRAND_PRIMARY },
};

export function formatDate(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago", then an absolute date. */
export function formatRelative(value?: string | null): string {
  if (!value) return '';
  const ms = Date.now() - new Date(value).getTime();
  if (ms < 0) return 'Scheduled';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function isThisWeek(value?: string | null): boolean {
  if (!value) return false;
  const days = (Date.now() - new Date(value).getTime()) / 86400000;
  return days >= 0 && days <= 7;
}

export function formatKb(kb?: number): string {
  if (!kb) return '';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Rich text
 *
 * The web renders the composer's HTML body directly. React Native has no HTML
 * renderer here, so the body is parsed into block + inline spans that map onto
 * nested <Text> elements. Only the tags the composer can actually produce are
 * handled; anything else degrades to its text content.
 * ─────────────────────────────────────────────────────────────────────── */

export type InlineSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  href?: string;
};

export type RichBlock =
  | { kind: 'heading'; level: number; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'listItem'; ordered: boolean; index: number; spans: InlineSpan[] }
  | { kind: 'quote'; spans: InlineSpan[] };

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  middot: '·',
  bull: '•',
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
    if (code.startsWith('#')) {
      const hex = code[1] === 'x' || code[1] === 'X';
      const num = hex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

type InlineStyle = Omit<InlineSpan, 'text'>;

/** Parses a fragment's inline markup into styled runs. */
function parseInline(html: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const stack: InlineStyle[] = [{}];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const pushText = (raw: string) => {
    if (!raw) return;
    // Collapse HTML whitespace, but keep explicit <br> newlines (added below).
    const text = decodeEntities(raw).replace(/[ \t\r\n]+/g, ' ');
    if (!text) return;
    spans.push({ text, ...stack[stack.length - 1] });
  };

  while ((match = tagPattern.exec(html))) {
    pushText(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const name = match[1].toLowerCase();
    const closing = match[0].startsWith('</');

    if (name === 'br') {
      spans.push({ text: '\n', ...stack[stack.length - 1] });
      continue;
    }

    const current = stack[stack.length - 1];
    // The base style at index 0 is never popped, so malformed markup with
    // stray close tags cannot empty the stack.
    const popStyle = () => {
      if (stack.length > 1) stack.pop();
    };

    if (name === 'strong' || name === 'b') {
      if (closing) popStyle();
      else stack.push({ ...current, bold: true });
    } else if (name === 'em' || name === 'i') {
      if (closing) popStyle();
      else stack.push({ ...current, italic: true });
    } else if (name === 'u' || name === 'ins') {
      if (closing) popStyle();
      else stack.push({ ...current, underline: true });
    } else if (name === 'a') {
      if (closing) {
        popStyle();
      } else {
        const href = match[2].match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
        stack.push({
          ...current,
          href: decodeEntities(href?.[2] ?? href?.[3] ?? '') || undefined,
        });
      }
    }
    // Any other inline tag (span, font, code…) contributes only its text.
  }

  pushText(html.slice(cursor));
  return spans;
}

const BLOCK_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'blockquote', 'ul', 'ol', 'li',
  'div', 'section', 'article', 'header', 'footer', 'main',
]);

/** Index of the close tag matching an already-opened `tag`, honouring nesting. */
function findMatchingClose(
  html: string,
  tag: string,
  startAfter: number,
): number {
  const pattern = new RegExp(`<(/?)${tag}(?:\\s[^>]*)?>`, 'gi');
  pattern.lastIndex = startAfter;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    if (match[1]) {
      depth -= 1;
      if (depth === 0) return match.index;
    } else {
      depth += 1;
    }
  }
  return -1;
}

function hasContent(spans: InlineSpan[]): boolean {
  return spans.some((span) => span.text.trim().length > 0);
}

function collectBlocks(html: string, out: RichBlock[]): void {
  const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  let cursor = 0;
  let loose = '';
  let match: RegExpExecArray | null;

  const flushLoose = () => {
    const spans = parseInline(loose);
    loose = '';
    if (hasContent(spans)) out.push({ kind: 'paragraph', spans });
  };

  while ((match = tagPattern.exec(html))) {
    const name = match[1].toLowerCase();
    if (!BLOCK_TAGS.has(name)) continue; // inline tag — parseInline handles it

    loose += html.slice(cursor, match.index);
    flushLoose();

    const contentStart = match.index + match[0].length;
    const closeIndex = findMatchingClose(html, name, contentStart);
    const inner =
      closeIndex === -1
        ? html.slice(contentStart)
        : html.slice(contentStart, closeIndex);

    if (name === 'ul' || name === 'ol') {
      const ordered = name === 'ol';
      const itemPattern = /<li(?:\s[^>]*)?>/gi;
      let itemMatch: RegExpExecArray | null;
      let index = 0;
      while ((itemMatch = itemPattern.exec(inner))) {
        const itemStart = itemMatch.index + itemMatch[0].length;
        const itemClose = findMatchingClose(inner, 'li', itemStart);
        const itemInner =
          itemClose === -1 ? inner.slice(itemStart) : inner.slice(itemStart, itemClose);
        const spans = parseInline(itemInner);
        if (hasContent(spans)) {
          index += 1;
          out.push({ kind: 'listItem', ordered, index, spans });
        }
        if (itemClose === -1) break;
        itemPattern.lastIndex = itemClose;
      }
    } else if (/^h[1-6]$/.test(name)) {
      const spans = parseInline(inner);
      if (hasContent(spans)) {
        out.push({ kind: 'heading', level: Number(name[1]), spans });
      }
    } else if (name === 'blockquote') {
      const spans = parseInline(inner);
      if (hasContent(spans)) out.push({ kind: 'quote', spans });
    } else if (name === 'p' || name === 'li') {
      const spans = parseInline(inner);
      if (hasContent(spans)) out.push({ kind: 'paragraph', spans });
    } else {
      // Wrapper element — recurse so its block children keep their structure.
      collectBlocks(inner, out);
    }

    cursor = closeIndex === -1 ? html.length : closeIndex;
    // Skip past the close tag itself before scanning on.
    const afterClose = html.indexOf('>', cursor);
    cursor = afterClose === -1 ? html.length : afterClose + 1;
    tagPattern.lastIndex = cursor;
  }

  loose += html.slice(cursor);
  flushLoose();
}

/** Parses a composer HTML body into renderable blocks. */
export function htmlToBlocks(html: string): RichBlock[] {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  const out: RichBlock[] = [];
  collectBlocks(cleaned, out);
  return out;
}

/** Plain-text preview of an HTML body — used for search and collapsed cards. */
export function htmlToPlainText(html: string): string {
  return htmlToBlocks(html)
    .map((block) => block.spans.map((span) => span.text).join(''))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Only http(s), mailto and tel links are ever opened from a card. */
export function safeLinkUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return null;
}

/** Same guard for media sources, where only http(s) is renderable. */
export function safeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:/i.test(trimmed)) return trimmed;
  return null;
}
