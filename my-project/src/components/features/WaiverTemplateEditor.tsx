import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Underline,
} from 'lucide-react';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WaiverTemplateEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const lineBoundsAt = (value: string, selectionStart: number, selectionEnd: number) => {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf('\n', selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  return { lineStart, lineEnd };
};

const LIST_PREFIX_RE = /^([-*]|\d+[.)])\s+/;

const ToolbarButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    title={label}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </Button>
);

/**
 * Structured text editor for shelter waiver templates. Buttons insert the
 * same Markdown-like markers the document renderer understands, so the live
 * preview beside the editor is an exact reflection of the saved template.
 */
export const WaiverTemplateEditor = ({
  id,
  value,
  onChange,
  error,
}: WaiverTemplateEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyEdit = (next: string, selectionStart: number, selectionEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const replaceBlock = (transform: (lines: string[]) => string[]) => {
    const el = textareaRef.current;
    if (!el) return;
    const { lineStart, lineEnd } = lineBoundsAt(value, el.selectionStart, el.selectionEnd);
    const block = value.slice(lineStart, lineEnd);
    const nextBlock = transform(block.split('\n')).join('\n');
    applyEdit(
      value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
      lineStart,
      lineStart + nextBlock.length,
    );
  };

  const toggleHeading = (level: 1 | 2 | 3) => {
    const prefix = `${'#'.repeat(level)} `;
    replaceBlock((lines) => {
      const allHavePrefix = lines.every((line) => line.startsWith(prefix));
      return lines.map((line) => {
        const stripped = line.replace(/^#{1,3}\s+/, '');
        return allHavePrefix ? stripped : `${prefix}${stripped}`;
      });
    });
  };

  const toggleList = (kind: 'bullet' | 'number') => {
    replaceBlock((lines) => {
      const allHavePrefix = lines.every((line) =>
        kind === 'bullet' ? /^[-*]\s+/.test(line) : /^\d+[.)]\s+/.test(line),
      );
      return lines.map((line, index) => {
        const stripped = line.replace(LIST_PREFIX_RE, '');
        if (allHavePrefix) return stripped;
        return kind === 'bullet' ? `- ${stripped}` : `${index + 1}. ${stripped}`;
      });
    });
  };

  const toggleQuote = () => {
    replaceBlock((lines) => {
      const allHavePrefix = lines.every((line) => /^>\s?/.test(line));
      return lines.map((line) => {
        const stripped = line.replace(/^>\s?/, '');
        return allHavePrefix ? stripped : `> ${stripped}`;
      });
    });
  };

  const wrapSelection = (marker: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (
      selected.length > marker.length * 2 &&
      selected.startsWith(marker) &&
      selected.endsWith(marker)
    ) {
      const inner = selected.slice(marker.length, -marker.length);
      applyEdit(before + inner + after, start, start + inner.length);
      return;
    }

    if (before.endsWith(marker) && after.startsWith(marker)) {
      const next = before.slice(0, -marker.length) + selected + after.slice(marker.length);
      applyEdit(next, start - marker.length, end - marker.length);
      return;
    }

    const next = `${before}${marker}${selected}${marker}${after}`;
    applyEdit(
      next,
      start + marker.length,
      start + marker.length + selected.length,
    );
  };

  const insertSnippet = (snippet: string, cursorOffset: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const next = value.slice(0, start) + snippet + value.slice(el.selectionEnd);
    applyEdit(next, start + cursorOffset, start + cursorOffset);
  };

  const insertTable = () => {
    const snippet = '\n| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n';
    insertSnippet(snippet, snippet.indexOf('Column 1') + 'Column 1'.length);
  };

  const insertDivider = () => insertSnippet('\n\n---\n\n', 5);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-input bg-muted/40 p-1">
        <ToolbarButton label="Heading 1 (underlined title)" onClick={() => toggleHeading(1)}>
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 2 (underlined section)" onClick={() => toggleHeading(2)}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => toggleHeading(3)}>
          <Heading3 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Bold" onClick={() => wrapSelection('**')}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => wrapSelection('*')}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => wrapSelection('__')}>
          <Underline className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Bulleted list" onClick={() => toggleList('bullet')}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => toggleList('number')}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Highlighted notice" onClick={toggleQuote}>
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Table" onClick={insertTable}>
          <Table className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={insertDivider}>
          <Minus className="size-4" />
        </ToolbarButton>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={14}
        placeholder={
          '# Adoption Liability Waiver\n' +
          '## Section 1. Parties & Animal Identification\n' +
          'Write the waiver terms here…\n\n' +
          '## Section 2. Acknowledgments\n' +
          '- First acknowledgment\n' +
          '1. First numbered requirement'
        }
        aria-invalid={Boolean(error)}
        className={cn(
          'rounded-t-none font-mono text-[12.5px] leading-relaxed',
          error &&
            'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
        )}
      />
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none font-medium">Formatting help</summary>
        <ul className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <li>
            <code># Title</code> — underlined heading
          </li>
          <li>
            <code>## Section</code> — underlined section heading
          </li>
          <li>
            <code>**bold**</code> · <code>*italic*</code> · <code>__underline__</code>
          </li>
          <li>
            <code>- item</code> · <code>1. item</code> · <code>&gt; notice</code>
          </li>
          <li>
            <code>| Label | Detail |</code> — tables
          </li>
          <li>
            <code>---</code> — divider
          </li>
        </ul>
      </details>
      {error ? (
        <p role="alert" className="mt-1 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};
