import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { apiClient } from '../../api/client';
import { CsvPreview } from '../../components/import/CsvPreview';
import { ColumnMapper } from '../../components/import/ColumnMapper';
import type { CsvMapping, ImportDefaults } from '../../components/import/ColumnMapper';
import { ImportProgress } from '../../components/import/ImportProgress';

interface PreviewState {
  fileToken: string;
  headers: string[];
  sampleRows: string[][];
}

interface JobState {
  status: 'processing' | 'done';
  rowsProcessed: number;
  totalRows: number;
  imported?: number;
  skipped?: { row: number; reason: string }[];
}

export function CsvImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    const { data, error: apiError } = await apiClient.POST('/api/import/csv/preview', {
      body: formData as unknown as never,
    });
    if (apiError) {
      setError('Could not read this file. Only comma-delimited UTF-8 CSV is supported.');
      return;
    }
    setPreview(data as PreviewState);
  }

  async function handleCommit(mapping: CsvMapping, defaults: ImportDefaults) {
    if (!preview) return;
    const { data, error: apiError } = await apiClient.POST('/api/import/csv/commit', {
      body: { fileToken: preview.fileToken, mapping, ...defaults },
    });
    if (apiError || !data?.jobId) {
      setError('Could not start the import — the upload may have expired, try again.');
      return;
    }
    poll(data.jobId);
  }

  function poll(jobId: string) {
    const interval = setInterval(async () => {
      const { data } = await apiClient.GET('/api/import/csv/commit/{jobId}', { params: { path: { jobId } } });
      if (data) {
        setJob(data as JobState);
        if (data.status === 'done') clearInterval(interval);
      }
    }, 300);
  }

  return (
    <div className="glass-panel config-list">
      <h3>Import from CSV</h3>
      <p className="text-muted">Upload a bank-exported CSV to bulk-add transactions. Comma-delimited UTF-8 files only.</p>

      {!preview && !job && (
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          <UploadCloud size={18} /> Choose CSV file
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="field-error">{error}</p>}

      {preview && !job && (
        <>
          <CsvPreview headers={preview.headers} sampleRows={preview.sampleRows} />
          <ColumnMapper headers={preview.headers} onConfirm={handleCommit} />
        </>
      )}

      {job && <ImportProgress job={job} />}

      {job?.status === 'done' && (
        <button
          className="btn btn-secondary"
          onClick={() => {
            setPreview(null);
            setJob(null);
          }}
        >
          Import another file
        </button>
      )}
    </div>
  );
}
