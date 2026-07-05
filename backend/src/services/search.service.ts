import { sqlite } from '../db/client';
import { getById } from './transaction.service';

/** Escapes SQL LIKE wildcards so user input is matched literally, never as a pattern (SYSTEM_DESIGN.md §6). */
export function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * `cursor` is a simple row offset (not true keyset pagination) — a deliberate simplification
 * given the PRD's data scale; still satisfies "capped/paginated, most-recent-first" (PRD §5.6).
 */
export function search(q: string, cursor: number, limit: number) {
  const trimmed = q.trim();
  if (!trimmed) return { items: [], nextCursor: null };

  const pattern = `%${escapeLikePattern(trimmed)}%`;
  const stmt = sqlite.prepare(`
    SELECT DISTINCT t.id AS id
    FROM transactions t
    LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
    LEFT JOIN tags tg ON tg.id = tt.tag_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN income_sources inc ON inc.id = t.income_source_id
    LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
    WHERE (t.note LIKE ? ESCAPE '\\' COLLATE NOCASE)
       OR (tg.name LIKE ? ESCAPE '\\' COLLATE NOCASE)
       OR (c.name LIKE ? ESCAPE '\\' COLLATE NOCASE)
       OR (inc.name LIKE ? ESCAPE '\\' COLLATE NOCASE)
       OR (pm.name LIKE ? ESCAPE '\\' COLLATE NOCASE)
    ORDER BY t.date DESC, t.id DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(pattern, pattern, pattern, pattern, pattern, limit + 1, cursor) as { id: number }[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map((r) => getById(r.id)),
    nextCursor: hasMore ? cursor + limit : null,
  };
}
