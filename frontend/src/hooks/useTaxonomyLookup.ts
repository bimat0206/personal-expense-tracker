import { useMemo } from 'react';
import { useCategories, useIncomeSources, usePaymentMethods, useTags } from './useSettings';

/**
 * Historical reports always show a taxonomy item's *current* name, even after a rename or
 * archive (PRD §5.2) — so lookups always include archived items, never filter them out.
 */
export function useTaxonomyLookup() {
  const categories = useCategories(true);
  const incomeSources = useIncomeSources(true);
  const paymentMethods = usePaymentMethods(true);
  const tags = useTags(true);

  const nameFor = useMemo(() => {
    const maps = {
      category: new Map(categories.items.map((i) => [i.id, i.name])),
      incomeSource: new Map(incomeSources.items.map((i) => [i.id, i.name])),
      paymentMethod: new Map(paymentMethods.items.map((i) => [i.id, i.name])),
      tag: new Map(tags.items.map((i) => [i.id, i.name])),
    };
    return {
      category: (id: number) => maps.category.get(id) ?? `Category #${id}`,
      incomeSource: (id: number) => maps.incomeSource.get(id) ?? `Source #${id}`,
      paymentMethod: (id: number) => maps.paymentMethod.get(id) ?? `Payment #${id}`,
      tag: (id: number) => maps.tag.get(id) ?? `Tag #${id}`,
    };
  }, [categories.items, incomeSources.items, paymentMethods.items, tags.items]);

  return {
    nameFor,
    categories: categories.items.filter((c) => !c.archived),
    incomeSources: incomeSources.items.filter((c) => !c.archived),
    paymentMethods: paymentMethods.items.filter((c) => !c.archived),
    tags: tags.items.filter((c) => !c.archived),
    loading: categories.loading || incomeSources.loading || paymentMethods.loading || tags.loading,
  };
}
