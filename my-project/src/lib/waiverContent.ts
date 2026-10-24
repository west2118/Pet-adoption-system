/**
 * Parser for shelter-authored waiver content.
 *
 * The stored `body` stays plain text so existing templates keep working. A
 * small, predictable subset of Markdown-like formatting is supported:
 *
 *   # Heading 1            (document title, underlined)
 *   ## Heading 2           (section heading, underlined)
 *   ### Heading 3
 *   **bold**  *italic*  __underline__
 *   - bullet item
 *   1. numbered item
 *   > highlighted notice
 *   ---                    (divider)
 *   | Cell | Cell |        (table, optional --- separator row)
 *
 * Everything else renders as normal paragraphs; single line breaks are kept.
 */

export type WaiverContentBlock =
  | { type: 'heading1'; text: string }
  | { type: 'heading2'; text: string }
  | { type: 'heading3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbers'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'divider' }
  | { type: 'table'; header: string[] | null; rows: string[][] };

const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const BULLET_RE = /^[-*]\s+(.*)$/;
const NUMBER_RE = /^\d+[.)]\s+(.*)$/;
const DIVIDER_RE = /^-{3,}$/;
const QUOTE_RE = /^>\s?(.*)$/;
const TABLE_ROW_RE = /^\|.*\|$/;
const TABLE_SEPARATOR_RE = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/;

const isTableRow = (line: string) => TABLE_ROW_RE.test(line.trim());
const isTableSeparator = (line: string) => TABLE_SEPARATOR_RE.test(line.trim());

const startsSpecialBlock = (line: string) =>
  HEADING_RE.test(line) ||
  BULLET_RE.test(line) ||
  NUMBER_RE.test(line) ||
  DIVIDER_RE.test(line) ||
  QUOTE_RE.test(line) ||
  isTableRow(line);

const splitTableCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

export const parseWaiverBody = (body: string): WaiverContentBlock[] => {  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const blocks: WaiverContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '') {
      i += 1;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      blocks.push({ type: `heading${level}`, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (DIVIDER_RE.test(line)) {
      blocks.push({ type: 'divider' });
      i += 1;
      continue;
    }

    const quote = QUOTE_RE.exec(line);
    if (quote) {
      const quoteLines: string[] = [quote[1].trim()];
      i += 1;
      while (i < lines.length) {
        const next = QUOTE_RE.exec(lines[i].trim());
        if (!next) break;
        quoteLines.push(next[1].trim());
        i += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet) {
      const items: string[] = [bullet[1].trim()];
      i += 1;
      while (i < lines.length) {
        const next = BULLET_RE.exec(lines[i].trim());
        if (!next) break;
        items.push(next[1].trim());
        i += 1;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    const numbered = NUMBER_RE.exec(line);
    if (numbered) {
      const items: string[] = [numbered[1].trim()];
      i += 1;
      while (i < lines.length) {
        const next = NUMBER_RE.exec(lines[i].trim());
        if (!next) break;
        items.push(next[1].trim());
        i += 1;
      }
      blocks.push({ type: 'numbers', items });
      continue;
    }

    if (isTableRow(line)) {
      const rows: string[][] = [];
      let separatorIndex = -1;
      while (i < lines.length && isTableRow(lines[i])) {
        if (isTableSeparator(lines[i])) {
          if (separatorIndex === -1) separatorIndex = rows.length;
        } else {
          rows.push(splitTableCells(lines[i]));
        }
        i += 1;
      }
      const hasHeader = separatorIndex === 1 && rows.length > 0;
      blocks.push({
        type: 'table',
        header: hasHeader ? rows[0] : null,
        rows: hasHeader ? rows.slice(1) : rows,
      });
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (next === '' || startsSpecialBlock(next)) break;
      paragraph.push(next);
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
  }

  return blocks;
};

/** Flattens Markdown-like markers for compact list/card snippets. */
export const formatWaiverBodyPreview = (body: string): string =>
  body
    .replace(/^-{3,}$/gm, ' ')
    .replace(/^\|?[\s:|-]+\|$/gm, ' ')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^([-*]|\d+[.)])\s+/gm, '')
    .replace(/\|/g, ' · ')
    .replace(/[*_]{1,2}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
