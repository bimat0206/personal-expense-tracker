import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ConfigItem } from '../../hooks/useSettings';

export interface ConfigFieldOptions {
  showType?: boolean;
  typeOptions?: { value: string; label: string }[];
}

interface ConfigItemFormProps {
  initial?: Partial<ConfigItem>;
  fields?: ConfigFieldOptions;
  onSubmit: (payload: Partial<ConfigItem>) => Promise<void>;
  onCancel: () => void;
}

export function ConfigItemForm({ initial, fields, onSubmit, onCancel }: ConfigItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? fields?.typeOptions?.[0]?.value ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), ...(fields?.showType ? { type } : {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="config-item-form">
      <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      {fields?.showType && (
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {fields.typeOptions?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
