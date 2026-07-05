import { useIncomeSources } from '../../hooks/useSettings';
import { ConfigList } from '../../components/config/ConfigList';

export function IncomeSources() {
  const { items, loading, error, refetch, create, createRaw, update, updateRaw, archive, unarchive, remove } = useIncomeSources(true);
  return (
    <ConfigList
      title="Income Sources"
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
