import { useTags } from '../../hooks/useSettings';
import { ConfigList } from '../../components/config/ConfigList';

export function Tags() {
  const { items, loading, error, refetch, create, createRaw, update, updateRaw, archive, unarchive, remove } = useTags(true);
  return (
    <ConfigList
      title="Tags"
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
