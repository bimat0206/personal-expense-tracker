interface ImportJobStatus {
  status: 'processing' | 'done';
  rowsProcessed: number;
  totalRows: number;
  imported?: number;
  skipped?: { row: number; reason: string }[];
}

export function ImportProgress({ job }: { job: ImportJobStatus }) {
  const pct = job.totalRows ? Math.round((job.rowsProcessed / job.totalRows) * 100) : 0;

  return (
    <div className="glass-panel form-stack">
      {job.status === 'processing' ? (
        <>
          <p>Importing rows… ({job.rowsProcessed} / {job.totalRows})</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <>
          <p>
            Imported <strong>{job.imported}</strong> transaction{job.imported === 1 ? '' : 's'}
            {job.skipped && job.skipped.length > 0 && `, skipped ${job.skipped.length}`}.
          </p>
          {job.skipped && job.skipped.length > 0 && (
            <ul className="skipped-list">
              {job.skipped.map((s) => (
                <li key={s.row}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
