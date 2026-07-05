import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';

const DEFAULT_CURRENCY_CODE = 'USD';

export function FirstRunSetup({ onComplete }: { onComplete: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const { error: apiError } = await apiClient.POST('/api/settings/first-run', {
      body: { currencyCode: DEFAULT_CURRENCY_CODE },
    });
    if (apiError) {
      setError('Setup failed — please try again.');
      setSaving(false);
      return;
    }
    onComplete();
  }

  return (
    <div className="first-run-screen">
      <div className="glass-panel first-run-card">
        <Sparkles size={40} className="first-run-icon" />
        <h1>Welcome to ExpenseTracker</h1>
        <p className="text-muted">A private, local expense tracker — your data never leaves this machine.</p>
        <p className="text-muted">You can change your currency any time in Settings → App Settings.</p>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Setting up…' : 'Get Started'}
        </button>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
