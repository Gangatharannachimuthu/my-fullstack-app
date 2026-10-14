import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Factory, LayoutDashboard, LogOut, ReceiptText, Truck, UserCog, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { useBusiness } from '../business';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/raw-materials', label: 'Raw Materials', icon: Truck },
  { to: '/manufacturing', label: 'Manufacturing', icon: Factory },
  { to: '/orders', label: 'Orders & Bills', icon: ReceiptText },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/admin-profile', label: 'Admin Profile', icon: UserCog },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();
  const name = business?.business_name || 'Sri Saravana Interlock Bricks Manufacturing';

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar no-print" aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">{name}</span>
        </div>
        <nav>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="muted">Signed in as {admin?.display_name}</span>
          <button type="button" className="nav-link nav-button" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      <header className="topbar no-print">
        <span className="brand-mark" aria-hidden="true" />
        <span className="topbar-name">{name}</span>
        <button type="button" className="btn btn-small btn-ghost" onClick={signOut} aria-label="Logout">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </header>

      <main id="main" className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav no-print" aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="bottom-link">
            <Icon size={20} aria-hidden="true" />
            <span>{label.replace(' & Bills', '').replace('Admin ', '').replace('Raw Materials', 'Materials').replace('Manufacturing', 'Production')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
