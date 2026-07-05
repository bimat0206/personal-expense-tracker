import { useState } from 'react';
import type { CSSProperties } from 'react';

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface TagPickerProps {
  allTags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function TagPicker({ allTags, selectedIds, onChange }: TagPickerProps) {
  const [filter, setFilter] = useState('');
  const visible = allTags.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  return (
    <div className="tag-picker">
      {allTags.length > 6 && (
        <input
          className="input"
          placeholder="Filter tags…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      <div className="tag-picker-options">
        {visible.length === 0 && <span className="text-muted">No tags yet</span>}
        {visible.map((tag) => (
          <button
            type="button"
            key={tag.id}
            className={`tag-chip ${selectedIds.includes(tag.id) ? 'selected' : ''}`}
            style={tag.color ? ({ '--chip-color': tag.color } as CSSProperties) : undefined}
            onClick={() => toggle(tag.id)}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
