import React, { useEffect, useMemo, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Settings, User } from 'lucide-react';
import { AppLogoMark, GLOBAL_NAV_ITEMS, PROJECT_NAV_ITEMS, VERSION_NAV_ITEMS } from '../constants';
import { clearAuthToken, workflowApi } from '../services/apiService';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightPanel?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, rightPanel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const versionMatch = matchPath('/versions/:versionId/*', location.pathname);
  const projectMatch = matchPath('/projects/:projectId', location.pathname);

  const navItems = useMemo(() => {
    if (versionMatch?.params.versionId) {
      return VERSION_NAV_ITEMS(versionMatch.params.versionId);
    }
    if (projectMatch?.params.projectId) {
      return PROJECT_NAV_ITEMS(projectMatch.params.projectId);
    }
    return GLOBAL_NAV_ITEMS;
  }, [versionMatch?.params.versionId, projectMatch?.params.projectId]);

  useEffect(() => {
    let alive = true;
    workflowApi
      .getMyTasks()
      .then((tasks) => {
        if (!alive) return;
        const count = Array.isArray(tasks)
          ? tasks.filter((task) => String(task?.status).toUpperCase() === 'PENDING').length
          : 0;
        setPendingCount(count);
      })
      .catch(() => {
        if (alive) setPendingCount(0);
      });
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [base, query = ''] = path.split('?');
      return location.pathname === base && location.search.includes(query);
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebar = (
    <aside className="w-[260px] bg-[#F8FAFE] border-r border-slate-200 flex flex-col">
      <nav className="flex-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const tone = (item as any).tone || 'text-slate-500';
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setMenuOpen(false);
              }}
              className={`group relative mb-1 flex w-full items-center gap-3 px-3 py-2 text-sm transition-all ${
                active
                  ? 'bg-[#E9F0FF] text-[#1A5CFF] font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {active && <span className="absolute left-0 top-1 h-7 w-1 bg-[#1A5CFF]" />}
              <span
                className={`transition-transform duration-200 ${active ? 'text-[#1A5CFF]' : `${tone} group-hover:rotate-[5deg]`}`}
              >
                {item.icon}
              </span>
              <span className="text-left">{item.label}</span>
              {item.id === 'my-tasks' && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <header className="h-16 border-b-2 border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setMenuOpen((v) => !v)}>
              <Menu size={20} />
            </button>
            <Link to="/overview" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-[#1A5CFF] to-[#0A3EB0] shadow-sm ring-1 ring-white/40">
                <AppLogoMark className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-900">工程成本系统</span>
                <div className="hidden md:block text-xs text-slate-500">{title || '全局概览'}</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* 消息通知 */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5CFF] to-[#0A3EB0] text-xs text-white font-medium shadow-sm">
                  AD
                </span>
                <span className="hidden text-sm md:block text-slate-700 font-medium">Admin</span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <User size={16} className="text-slate-500" />
                    <span className="text-slate-700">个人中心</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings size={16} className="text-slate-500" />
                    <span className="text-slate-700">系统设置</span>
                  </button>
                  <div className="my-1.5 h-px bg-slate-200"></div>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">{sidebar}</div>
        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden">
            <div className="h-full w-[260px] bg-[#F8FAFE]">{sidebar}</div>
          </div>
        )}

        <main className="flex min-w-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col overflow-auto p-4">
            <div className="mb-3 border-b border-slate-100 pb-2">
              <h1 className="text-base font-semibold">{title || '工作台'}</h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
            {children}
          </section>
          {rightPanel && (
            <aside className="hidden w-[320px] shrink-0 border-l border-slate-200 bg-[#F8FAFE] p-4 lg:block">
              {rightPanel}
            </aside>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
