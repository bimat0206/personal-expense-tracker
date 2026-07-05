import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useAppSettings } from '../../hooks/useSettings';

const DISMISS_KEY = 'backup-reminder-dismissed';

export function BackupReminderBanner() {
  const { settings } = useAppSettings();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === 'true');

  if (!settings?.backupReminderDue || dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="banner banner-warning">
      <ShieldAlert size={18} />
      <span>
        It's been a while since your last backup. <Link to="/settings/app">Export your data</Link> to keep it safe —
        remember this only backs up the database, not attached receipt files.
      </span>
      <button type="button" className="icon-btn" aria-label="Dismiss" onClick={dismiss}>
        <X size={16} />
      </button>
    </div>
  );
}
