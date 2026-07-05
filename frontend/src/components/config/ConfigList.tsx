import { useEffect, useMemo, useState } from 'react';
import { Plus, Archive, ArchiveRestore, Trash2, Save, ClipboardList } from 'lucide-react';
import type { ConfigItem } from '../../hooks/useSettings';
import type { ConfigFieldOptions } from './ConfigItemForm';
import { EmptyState } from '../shared/EmptyState';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { randomColor } from '../../utils/color';

interface ConfigListProps {
  title: string;
  items: ConfigItem[];
  loading: boolean;
  error: string | null;
  fields?: ConfigFieldOptions;
  refetch: () => Promise<void>;
  create: (payload: Partial<ConfigItem>) => Promise<void>;
  createRaw: (payload: Partial<ConfigItem>) => Promise<void>;
  update: (id: number, payload: Partial<ConfigItem>) => Promise<void>;
  updateRaw: (id: number, payload: Partial<ConfigItem>) => Promise<void>;
  archive: (id: number) => Promise<void>;
  unarchive: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

type DraftItem = Partial<ConfigItem> & { draftId: string; isNew?: boolean; _saveError?: string };

function toDraft(item: ConfigItem): DraftItem {
  return { ...item, draftId: String(item.id) };
}

export function ConfigList({ title, items, loading, error, fields, refetch, create: _create, createRaw, update: _update, updateRaw, archive, unarchive, remove }: ConfigListProps) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    setDrafts(items.map(toDraft));
  }, [items]);

  const originalById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const changedCount = drafts.filter((draft) => {
    if (draft.isNew) return draft.name?.trim();
    if (!draft.id) return false;
    const original = originalById.get(draft.id);
    if (!original) return false;
    return (
      draft.name !== original.name ||
      draft.type !== original.type ||
      draft.color !== original.color ||
      draft.icon !== original.icon ||
      Number(draft.sortOrder ?? 0) !== original.sortOrder
    );
  }).length;

  function patchDraft(draftId: string, patch: Partial<DraftItem>) {
    setDrafts((current) => current.map((draft) => (draft.draftId === draftId ? { ...draft, ...patch } : draft)));
  }

  function addDraft() {
    setDrafts((current) => [
      ...current,
      {
        draftId: `new-${Date.now()}`,
        isNew: true,
        name: '',
        type: fields?.typeOptions?.[0]?.value ?? null,
        color: randomColor(),
        icon: '',
        sortOrder: current.length,
        archived: false,
      },
    ]);
  }

  function addBulkDrafts() {
    const names = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!names.length) return;

    setDrafts((current) => [
      ...current,
      ...names.map((name, index) => ({
        draftId: `bulk-${Date.now()}-${index}`,
        isNew: true,
        name,
        type: fields?.typeOptions?.[0]?.value ?? null,
        color: randomColor(),
        icon: '',
        sortOrder: current.length + index,
        archived: false,
      })),
    ]);
    setBulkText('');
  }

  async function saveAll() {
    setSaving(true);
    setActionError(null);
    const rowErrors: Record<string, string> = {};

    for (const draft of drafts) {
      const name = draft.name?.trim();
      if (!name) continue;

      // Only send defined, non-empty optional fields — omitting rather than nulling keeps
      // the payload compatible with .optional() schemas and avoids spurious Zod errors.
      const payload: Partial<ConfigItem> = { name, sortOrder: Number(draft.sortOrder ?? 0) };
      if (draft.color) payload.color = draft.color;
      if (draft.icon) payload.icon = draft.icon;
      if (fields?.showType && draft.type) payload.type = draft.type;

      try {
        if (draft.isNew) {
          await createRaw(payload);
        } else if (draft.id) {
          const original = originalById.get(draft.id);
          if (!original) continue;
          const changed =
            payload.name !== original.name ||
            payload.type !== original.type ||
            (payload.color ?? null) !== (original.color ?? null) ||
            (payload.icon ?? null) !== (original.icon ?? null) ||
            payload.sortOrder !== original.sortOrder;
          if (changed) await updateRaw(draft.id, payload);
        }
      } catch (err) {
        rowErrors[draft.draftId] = err instanceof Error ? err.message : 'Could not save';
      }
    }

    // Single refetch after the whole batch — avoids resetting draft state mid-loop.
    await refetch();
    setSaving(false);

    const failedCount = Object.keys(rowErrors).length;
    if (failedCount > 0) {
      const messages = Object.values(rowErrors);
      const unique = [...new Set(messages)];
      setActionError(
        failedCount === 1
          ? unique[0]
          : `${failedCount} rows could not be saved: ${unique.join('; ')}`
      );
      setDrafts((current) =>
        current.map((d) =>
          rowErrors[d.draftId] ? { ...d, _saveError: rowErrors[d.draftId] } : { ...d, _saveError: undefined }
        )
      );
    }
  }


  async function handleRemove(id: number) {
    try {
      await remove(id);
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="config-list">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p className="text-muted">Edit several rows, then save them together.</p>
        </div>
        <div className="config-toolbar">
          <button className="btn btn-secondary btn-sm" onClick={addDraft}>
            <Plus size={16} /> Add row
          </button>
          <button className="btn btn-primary btn-sm" onClick={saveAll} disabled={saving || changedCount === 0}>
            <Save size={16} /> {saving ? 'Saving...' : `Save ${changedCount || ''}`.trim()}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <EmptyState title="Couldn't load" description={error} />}
      {actionError && <p className="field-error">{actionError}</p>}

      <div className="bulk-add-panel">
        <div className="bulk-add-copy">
          <ClipboardList size={18} />
          <div>
            <strong>Paste names to bulk add</strong>
            <p className="text-muted">One name per line. Review the new rows below, then save.</p>
          </div>
        </div>
        <textarea
          className="input bulk-add-textarea"
          value={bulkText}
          placeholder={`Groceries\nSubscriptions\nClient lunch`}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" onClick={addBulkDrafts} disabled={!bulkText.trim()}>
          <Plus size={16} /> Add pasted rows
        </button>
      </div>

      {!loading && drafts.length === 0 && <EmptyState title={`No ${title.toLowerCase()} yet`} />}

      {!loading && drafts.length > 0 && (
        <div className="config-table-wrap">
          <table className="config-table">
            <thead>
              <tr>
                <th>Name</th>
                {fields?.showType && <th>Type</th>}
                <th>Color</th>
                <th>Order</th>
                <th>Status</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr key={draft.draftId} className={`${draft.archived ? 'archived' : ''} ${draft._saveError ? 'row-error' : ''}`}>
                  <td data-label="Name">
                    <div>
                      <input
                        className={`input compact-input${draft._saveError ? ' input-error' : ''}`}
                        value={draft.name ?? ''}
                        placeholder="Name"
                        onChange={(e) => patchDraft(draft.draftId, { name: e.target.value, _saveError: undefined })}
                      />
                      {draft._saveError && (
                        <span className="row-error-msg">{draft._saveError}</span>
                      )}
                    </div>
                  </td>
                  {fields?.showType && (
                    <td data-label="Type">
                      <select
                        className="input compact-input"
                        value={draft.type ?? fields.typeOptions?.[0]?.value ?? ''}
                        onChange={(e) => patchDraft(draft.draftId, { type: e.target.value })}
                      >
                        {fields.typeOptions?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td data-label="Color">
                    <div className="color-field">
                      <input
                        type="color"
                        className="color-swatch"
                        aria-label={`Color for ${draft.name || 'this item'}`}
                        value={/^#[0-9a-fA-F]{6}$/.test(draft.color ?? '') ? (draft.color as string) : '#94a3b8'}
                        onChange={(e) => patchDraft(draft.draftId, { color: e.target.value })}
                      />
                      <input
                        className="input compact-input"
                        value={draft.color ?? ''}
                        placeholder="#2d7d76"
                        onChange={(e) => patchDraft(draft.draftId, { color: e.target.value })}
                      />
                    </div>
                  </td>
                  <td data-label="Order">
                    <input
                      className="input compact-number"
                      type="number"
                      value={draft.sortOrder ?? 0}
                      onChange={(e) => patchDraft(draft.draftId, { sortOrder: Number(e.target.value) })}
                    />
                  </td>
                  <td data-label="Status">
                    <span className={`status-pill ${draft.archived ? 'archived' : 'active'}`}>
                      {draft.isNew ? 'new' : draft.archived ? 'archived' : 'active'}
                    </span>
                  </td>
                  <td className="config-item-actions align-right" data-label="Actions">
                    <div className="action-buttons">
                      {draft.isNew ? (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Remove row"
                          onClick={() => setDrafts((current) => current.filter((item) => item.draftId !== draft.draftId))}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : draft.id && draft.archived ? (
                        <button type="button" className="icon-btn" title="Unarchive" onClick={() => unarchive(draft.id!)}>
                          <ArchiveRestore size={16} />
                        </button>
                      ) : draft.id ? (
                        <button type="button" className="icon-btn" title="Archive" onClick={() => archive(draft.id!)}>
                          <Archive size={16} />
                        </button>
                      ) : null}
                      {draft.id && (
                        <button type="button" className="icon-btn" title="Delete" onClick={() => handleRemove(draft.id!)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
