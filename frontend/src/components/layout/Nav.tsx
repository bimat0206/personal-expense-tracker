import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Heart, Search, Settings, Moon, Sun, WalletCards } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { currentYear, currentMonth } from '../../utils/date';

export function Nav() {
  const { theme, toggleTheme } = useTheme();
  const y = currentYear();
  const m = currentMonth();

  return (
    <nav className="sidebar glass-panel">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><WalletCards size={19} /></div>
        <div className="brand-copy">
          <h1>Expense Tracker</h1>
          <p>Local finance workspace</p>
        </div>
      </div>

      <p className="nav-section-label">Workspace</p>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Annual Overview</span>
        </NavLink>

        <NavLink to={`/transactions/${y}/${m}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ListOrdered size={20} />
          <span>Transactions</span>
        </NavLink>

        <NavLink to={`/wishlist/${y}/${m}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Heart size={20} />
          <span>Wish List</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          <span>Search</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>

      <div className="nav-footer">
        <button onClick={toggleTheme} className="btn btn-secondary theme-toggle">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </nav>
  );
}
