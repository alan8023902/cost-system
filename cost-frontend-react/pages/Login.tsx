import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { AppLogoMark } from '../constants';
import { authApi, setAuthToken } from '../services/apiService';

interface LoginProps {
  onLogin: () => void;
}

const REMEMBER_KEY = 'remember_login_id';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (username.length === 0) {
      setUsernameValid(null);
    } else if (username.length >= 3) {
      setUsernameValid(true);
    } else {
      setUsernameValid(false);
    }
  }, [username]);

  useEffect(() => {
    if (password.length === 0) {
      setPasswordValid(null);
    } else if (password.length >= 6) {
      setPasswordValid(true);
    } else {
      setPasswordValid(false);
    }
  }, [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login(username.trim(), password);
      setAuthToken(response.accessToken);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onLogin();
      navigate('/workbench');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {/* Logo 和标题居中 */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A5CFF] to-[#0A3EB0] shadow-md ring-1 ring-white/40">
                <AppLogoMark className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">建材成本管理系统</h1>
            <p className="text-sm text-slate-500">请输入账号信息后登录</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">用户名 / 邮箱 / 手机号</label>
              <div className="relative">
                <User size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  usernameValid === true ? 'text-blue-500' : usernameValid === false ? 'text-red-500' : 'text-blue-500'
                }`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full h-10 pl-11 pr-11 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                    usernameValid === true
                      ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-100'
                      : usernameValid === false
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  placeholder="请输入登录账号"
                  autoComplete="username"
                  required
                />
                {usernameValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameValid ? (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {usernameValid === false && (
                <p className="mt-1 text-xs text-red-600">用户名至少需要3个字符</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  passwordValid === true ? 'text-blue-500' : passwordValid === false ? 'text-red-500' : 'text-blue-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-10 pl-11 pr-20 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                    passwordValid === true
                      ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-100'
                      : passwordValid === false
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {passwordValid !== null && (
                    <div>
                      {passwordValid ? (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {passwordValid === false && (
                <p className="mt-1 text-xs text-red-600">密码至少需要6个字符</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-100"
                />
                记住我
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                忘记密码？
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="ui-btn ui-btn-primary w-full"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          © 2026 建材成本管理系统
        </p>
      </div>
    </div>
  );
};

export default Login;
