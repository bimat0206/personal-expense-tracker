import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppSettings } from '../../hooks/useSettings';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { CURRENCIES, centsToDisplay } from '../../utils/currency';

export function AppSettings() {
  const { settings, loading, update } = useAppSettings();
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [topExpensesCount, setTopExpensesCount] = useState(5);
  const [backupReminderThresholdDays, setBackupReminderThresholdDays] = useState(30);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setCurrencyCode(settings.currencyCode);
      setTopExpensesCount(settings.topExpensesCount);
      setBackupReminderThresholdDays(settings.backupReminderThresholdDays);
    }
  }, [settings]);

  async function handleSave() {
    await update({ currencyCode, topExpensesCount, backupReminderThresholdDays });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    const { data } = await apiClient.GET('/api/backup/export', {});
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    if (!window.confirm('This will replace ALL existing data with the contents of this backup. Continue?')) return;
    setImportError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confirm', 'true');
    const { error } = await apiClient.POST('/api/backup/import', {
      body: formData as unknown as never,
    });
    if (error) {
      setImportError('Import failed — the file may be invalid or from an incompatible version.');
      return;
    }
    window.location.reload();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="glass-panel config-list form-stack">
      <h3>App Settings</h3>
      <label>
        Currency code
        <select className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.symbol} (e.g., {centsToDisplay(1000 * c.multiplier, c.code)})
            </option>
          ))}
        </select>
      </label>
      <label>
        Top Expenses count (1–50)
        <input
          className="input"
          type="number"
          min={1}
          max={50}
          value={topExpensesCount}
          onChange={(e) => setTopExpensesCount(Number(e.target.value))}
        />
      </label>
      <label>
        Backup reminder threshold (days)
        <input
          className="input"
          type="number"
          min={1}
          value={backupReminderThresholdDays}
          onChange={(e) => setBackupReminderThresholdDays(Number(e.target.value))}
        />
      </label>
      <button className="btn btn-primary" onClick={handleSave}>{saved ? 'Saved!' : 'Save Settings'}</button>

      <hr />

      <h3>Backup &amp; Restore</h3>
      <p className="text-muted">
        Export downloads all your data as JSON. It does not include receipt attachment files — back up the{' '}
        <code>data/attachments</code> folder separately.
      </p>
      <div className="filters-row">
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} /> Export Data
        </button>
        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Import Backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {importError && <p className="field-error">{importError}</p>}
    </div>
  );
}
