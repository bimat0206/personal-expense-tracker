import { useCategories } from '../../hooks/useSettings';
import { ConfigList } from '../../components/config/ConfigList';

export function Categories() {
  const { items, loading, error, refetch, create, createRaw, update, updateRaw, archive, unarchive, remove } = useCategories(true);
  return (
    <ConfigList
      title="Expense Categories"
      items={items}
      loading={loading}
      error={error}
      refetch={refetch}
      create={create}
      createRaw={createRaw}
      update={update}
      updateRaw={updateRaw}
      archive={archive}
      unarchive={unarchive}
      remove={remove}
    />
  );
}
