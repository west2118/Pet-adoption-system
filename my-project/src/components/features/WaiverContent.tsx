import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { parseWaiverBody } from '@/lib/waiverContent';

const INLINE_RE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*)/g;

const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE_RE).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      return <u key={index}>{part.slice(2, -2)}</u>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });

const withLineBreaks = (text: string): ReactNode[] =>
  text.split('\n').flatMap((line, index) => [
    ...(index > 0 ? [<br key={`br-${index}`} />] : []),
    <Fragment key={`line-${index}`}>{renderInline(line)}</Fragment>,
  ]);

const Table = ({ header, rows }: { header: string[] | null; rows: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[10.5px]">
      {header ? (
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th
                key={index}
                className="border border-slate-300 bg-slate-50 px-2 py-1 text-left font-bold text-slate-700"
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="border border-slate-300 px-2 py-1 align-top text-slate-700"
              >
                {renderInline(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface FormattedWaiverContentProps {
  body: string;
  className?: string;
  emptyMessage?: string;
}

export const FormattedWaiverContent = ({
  body,
  className,
  emptyMessage = 'Your waiver content will appear here as you type.',
}: FormattedWaiverContentProps) => {
  const blocks = parseWaiverBody(body);

  if (blocks.length === 0) {
    return (
      <p className={cn('text-[11px] italic leading-relaxed text-slate-400', className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading1':
            return (
              <h1
                key={index}
                className="border-b-2 border-teal-800 pb-1 text-[20px] font-extrabold uppercase leading-tight tracking-tight text-teal-800"
              >
                {renderInline(block.text)}
              </h1>
            );
          case 'heading2':
            return (
              <h2
                key={index}
                className="border-b border-slate-300 pb-1 pt-1 text-[13px] font-extrabold uppercase tracking-wide text-teal-800"
              >
                {renderInline(block.text)}
              </h2>
            );
          case 'heading3':
            return (
              <h3 key={index} className="pt-1 text-[12px] font-bold text-slate-800">
                {renderInline(block.text)}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={index} className="text-[11px] leading-relaxed text-slate-700">
                {withLineBreaks(block.text)}
              </p>
            );
          case 'bullets':
            return (
              <ul
                key={index}
                className="list-disc space-y-1 pl-5 text-[11px] leading-relaxed text-slate-700 marker:text-teal-700"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case 'numbers':
            return (
              <ol
                key={index}
                className="list-decimal space-y-1 pl-5 text-[11px] leading-relaxed text-slate-700 marker:font-semibold marker:text-teal-700"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <div
                key={index}
                className="rounded-r-md border-l-4 border-teal-700 bg-slate-50 px-3 py-1.5"
              >
                <p className="text-[10.5px] leading-relaxed text-slate-700">
                  {renderInline(block.text)}
                </p>
              </div>
            );
          case 'divider':
            return <hr key={index} className="my-2 border-slate-300" />;
          case 'table':
            return <Table key={index} header={block.header} rows={block.rows} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
