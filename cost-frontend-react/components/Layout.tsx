
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, User } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  useEffect(() => {
    // Load pending task count
    loadPendingTaskCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingTaskCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingTaskCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workflow/my-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const tasks = result.data || result;
        const pending = tasks.filter((t: any) => t.status === 'PENDING');
        setPendingTaskCount(pending.length);
      }
    } catch (error) {
      console.error('Failed to load task count:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">ET</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-sm">工程成本税务系统</span>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                location.pathname.startsWith(item.path) && item.path !== '#'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <span className={`${location.pathname.startsWith(item.path) && item.path !== '#' ? 'text-white' : 'text-slate-400 group-hover:text-white'} mr-3`}>
                  {item.icon}
                </span>
                {item.label}
              </div>
              {item.path === '/my-tasks' && pendingTaskCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                  {pendingTaskCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            退出系统
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-slate-800">{title || '概览'}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/my-tasks')}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
              title="我的待办"
            >
              <Bell size={20} />
              {pendingTaskCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium border-2 border-white">
                  {pendingTaskCount > 9 ? '9+' : pendingTaskCount}
                </span>
              )}
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">张大为</p>
                <p className="text-xs text-slate-500">高级成本工程师</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                <User size={20} className="text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
