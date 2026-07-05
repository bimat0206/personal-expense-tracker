export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
