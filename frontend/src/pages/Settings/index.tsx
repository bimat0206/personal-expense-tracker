import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Categories } from './Categories';
import { IncomeSources } from './IncomeSources';
import { PaymentMethods } from './PaymentMethods';
import { Tags } from './Tags';
import { RecurringRules } from './RecurringRules';
import { CsvImport } from './CsvImport';
import { AppSettings } from './AppSettings';

const TABS = [
  { to: '/settings/categories', label: 'Categories' },
  { to: '/settings/income-sources', label: 'Income Sources' },
  { to: '/settings/payment-methods', label: 'Payment Methods' },
  { to: '/settings/tags', label: 'Tags' },
  { to: '/settings/recurring', label: 'Recurring' },
  { to: '/settings/import', label: 'CSV Import' },
  { to: '/settings/app', label: 'App Settings' },
];

export function Settings() {
  return (
    <div className="page-stack">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Control center</p>
          <h2>Settings</h2>
          <p className="text-muted">Manage lists in bulk, tune app defaults, and handle imports from one place.</p>
        </div>
      </div>
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `settings-tab ${isActive ? 'active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<Navigate to="categories" replace />} />
        <Route path="categories" element={<Categories />} />
        <Route path="income-sources" element={<IncomeSources />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="tags" element={<Tags />} />
        <Route path="recurring" element={<RecurringRules />} />
        <Route path="import" element={<CsvImport />} />
        <Route path="app" element={<AppSettings />} />
      </Routes>
    </div>
  );
}
