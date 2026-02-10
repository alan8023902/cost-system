
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Info } from 'lucide-react';
import { authApi, setAuthToken } from '../services/apiService';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.login(username, password);
      setAuthToken(response.token);
      onLogin();
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">工程成本计划与税务计控系统</h1>
          <p className="text-slate-500 mt-2 text-sm">数字化工程成本管理 & 合规税务控制</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[10px] shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">用户账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入您的账号"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">登录密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                required
              />
            </div>

            {error && (
              <div className="flex items-start space-x-2 text-red-500 text-xs mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700">记住登录状态</span>
              </label>
              <a href="#" className="text-xs text-blue-600 hover:underline">忘记密码?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 flex items-center justify-center space-x-2 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>立即登录</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">
              测试账号: <strong>admin</strong> / 密码: <strong>password</strong>
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} 工程技术集团有限公司. 保留所有权利
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
