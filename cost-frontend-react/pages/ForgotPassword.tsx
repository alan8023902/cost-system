import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../services/apiService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 重置密码
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    setSending(true);
    try {
      await authApi.sendPasswordResetCode(email.trim());
      setSuccess('验证码已发送到您的邮箱');
      setCountdown(60);
      setTimeout(() => setStep(2), 1000);
    } catch (err: any) {
      setError(err.message || '验证码发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('请输入新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 8) {
      setError('密码长度至少为 8 位');
      return;
    }

    setResetting(true);
    try {
      await authApi.resetPasswordByEmail({
        email: email.trim(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccess('密码重置成功！');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || '密码重置失败');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="w-full max-w-md">
        {/* 卡片 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 border border-slate-200/80">
          <button
            onClick={() => navigate('/login')}
            className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回登录</span>
          </button>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              {step === 1 ? '重置密码' : '设置新密码'}
            </h2>
            <p className="text-slate-600 text-sm">
              {step === 1 ? '请输入您的邮箱地址，我们将发送验证码' : '请输入验证码和新密码'}
            </p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= 1 ? 'bg-gradient-to-br from-[#1A5CFF] to-[#0A3EB0] text-white shadow-[0_4px_14px_rgba(26,92,255,0.4)]' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <span className={`text-xs transition-colors ${step >= 1 ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>验证邮箱</span>
              </div>
              <div className={`w-20 h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-[#1A5CFF] to-[#0A3EB0]' : 'bg-slate-200'}`}></div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= 2 ? 'bg-gradient-to-br from-[#1A5CFF] to-[#0A3EB0] text-white shadow-[0_4px_14px_rgba(26,92,255,0.4)]' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <span className={`text-xs transition-colors ${step >= 2 ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>重设密码</span>
              </div>
            </div>
          </div>

          {/* 步骤 1: 输入邮箱 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">{success}</div>
                </div>
              )}

              <button
                onClick={handleSendCode}
                disabled={sending || countdown > 0}
                className="ui-btn ui-btn-primary w-full h-11 gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>发送中...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>{countdown}秒后可重新发送</span>
                ) : (
                  <>
                    <span>发送验证码</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* 步骤 2: 重置密码 */}
          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-6 animate-fade-in">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
                  验证码
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                  placeholder="请输入邮箱验证码"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  新密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                    placeholder="请输入新密码（至少8位）"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                    placeholder="请再次输入新密码"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">{success}</div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ui-btn ui-btn-default flex-1 h-11"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="ui-btn ui-btn-primary flex-1 h-11 gap-2"
                >
                  {resetting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>重置中...</span>
                    </>
                  ) : (
                    <span>重置密码</span>
                  )}
                </button>
              </div>

              {countdown > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-slate-500">
          没有收到验证码?请检查垃圾邮件箱或联系管理员
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
