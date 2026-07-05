import { useRef, useState } from 'react';
import { Paperclip, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface AttachmentUploadProps {
  transactionId: number;
  attachmentId?: string | null;
  filename?: string | null;
  onChanged: () => void;
}

export function AttachmentUpload({ transactionId, attachmentId, filename, onChanged }: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { error: apiError } = await apiClient.POST('/api/transactions/{id}/attachment', {
        params: { path: { id: transactionId } },
        // openapi-fetch's default bodySerializer passes FormData through as-is; the typed body
        // shape here reflects the JSON schema, not the multipart form, hence the cast.
        body: formData as unknown as never,
      });
      if (apiError) throw new Error('Upload failed');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await apiClient.DELETE('/api/transactions/{id}/attachment', { params: { path: { id: transactionId } } });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="attachment-upload">
      {attachmentId ? (
        <div className="attachment-row">
          <Paperclip size={16} />
          <span className="text-muted">{filename ?? 'Receipt attached'}</span>
          <a className="icon-btn" href={`/api/transactions/${transactionId}/attachment`} target="_blank" rel="noreferrer">
            <Download size={16} />
          </a>
          <button type="button" className="icon-btn" onClick={handleRemove} disabled={busy}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Paperclip size={16} />
          {busy ? 'Uploading…' : 'Attach receipt'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
