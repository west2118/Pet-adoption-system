import type { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/Form';

export interface ListEditorProps {
  label: ReactNode;
  rows: string[];
  onChange: (rows: string[]) => void;
  presets: string[];
  placeholder: (index: number) => string;
  itemLabel: string;
  addLabel: string;
  error?: string;
}

/**
 * Reusable per-line list editor for temperament traits, medical records,
 * and behavioral notes with quick-add preset chips.
 */
export const ListEditor = ({
  label,
  rows,
  onChange,
  presets,
  placeholder,
  itemLabel,
  addLabel,
  error,
}: ListEditorProps) => {
  const updateRow = (index: number, value: string) =>
    onChange(rows.map((r, i) => (i === index ? value : r)));
  const addRow = () => onChange([...rows, '']);
  const removeRow = (index: number) =>
    onChange(rows.length <= 1 ? [''] : rows.filter((_, i) => i !== index));
  const addPreset = (preset: string) => {
    const trimmed = rows.map((r) => r.trim()).filter(Boolean);
    if (trimmed.includes(preset)) return;
    const emptyIndex = rows.findIndex((r) => r.trim() === '');
    if (emptyIndex >= 0) {
      onChange(rows.map((r, i) => (i === emptyIndex ? preset : r)));
    } else {
      onChange([...rows, preset]);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => addPreset(preset)}
            className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            + {preset}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={row}
              onChange={(e) => updateRow(i, e.target.value)}
              placeholder={placeholder(i)}
              aria-label={`${itemLabel} ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}
              onClick={() => removeRow(i)}
              className="shrink-0 text-muted-foreground hover:text-red-600"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2">
        <Plus className="size-3.5" /> {addLabel}
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

