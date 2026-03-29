import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Target } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import './Dashboard.css';

export function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand text-gradient">
          <Target size={24} /> TradeLog
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            end
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Trades</span>
          </NavLink>
          <NavLink 
            to="/dashboard/settings" 
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link btn-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
