import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { BackupReminderBanner } from './BackupReminderBanner';

export function Layout() {
  return (
    <div className="app-layout">
      <Nav />
      <main className="main-content">
        <BackupReminderBanner />
        <Outlet />
      </main>
    </div>
  );
}
