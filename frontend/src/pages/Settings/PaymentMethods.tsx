import { usePaymentMethods } from '../../hooks/useSettings';
import { ConfigList } from '../../components/config/ConfigList';

const TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export function PaymentMethods() {
  const { items, loading, error, refetch, create, createRaw, update, updateRaw, archive, unarchive, remove } = usePaymentMethods(true);
  return (
    <ConfigList
      title="Payment Methods"
      items={items}
      loading={loading}
      error={error}
      fields={{ showType: true, typeOptions: TYPE_OPTIONS }}
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
