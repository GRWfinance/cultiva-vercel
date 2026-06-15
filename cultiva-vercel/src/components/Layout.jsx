import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconHome, IconTarget, IconCompass, IconCalendar, IconClipboard,
  IconMessage, IconAward, IconTrendingUp, IconWallet, IconBookOpen, IconUsers,
} from './Icons';

const navGroups = [
  {
    label: 'Visão geral',
    items: [
      { to: '/', label: 'Início', icon: IconHome },
    ],
  },
  {
    label: 'Performance',
    items: [
      { to: '/avaliacoes', label: 'Avaliação de Desempenho', icon: IconClipboard },
      { to: '/okrs', label: 'OKRs', icon: IconTarget },
      { to: '/pdi', label: 'PDI', icon: IconCompass },
      { to: '/1-1s', label: '1:1s', icon: IconCalendar },
    ],
  },
  {
    label: 'Pessoas & cultura',
    items: [
      { to: '/pesquisas', label: 'Pesquisas', icon: IconMessage },
      { to: '/feedbacks', label: 'Feedbacks', icon: IconMessage },
      { to: '/elogios', label: 'Elogios', icon: IconAward },
      { to: '/sucessao', label: 'Sucessão', icon: IconUsers },
      { to: '/people-analytics', label: 'People Analytics', icon: IconTrendingUp },
    ],
  },
  {
    label: 'Benefícios & aprendizagem',
    items: [
      { to: '/beneficios', label: 'Benefícios', icon: IconWallet },
      { to: '/learning', label: 'Learning.Rocks', icon: IconBookOpen },
    ],
  },
];

function initials(name) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">C</div>
          <div className="sidebar-brand-name">Cultiva</div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <React.Fragment key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  end={item.to === '/'}
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Clique para sair">
          <div className="user-avatar">{user?.name ? initials(user.name) : (user?.role?.[0] || 'U')}</div>
          <div className="user-meta">
            <div className="user-meta-name">{user?.name || user?.role || 'Usuário'}</div>
            <div className="user-meta-role">{user?.jobTitle || 'Sair'}</div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <Outlet />
      </div>
    </div>
  );
}
