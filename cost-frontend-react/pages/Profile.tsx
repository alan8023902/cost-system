import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Lock, Mail, Save, User } from 'lucide-react';
import Layout from '../components/Layout';
import { authApi } from '../services/apiService';

type Message = { type: 'success' | 'error'; text: string } | null;

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const user = await authApi.getCurrentUser();
      setUsername(String(user?.username || ''));
      setEmail(String(user?.email || ''));
      setPhone(String(user?.phone || ''));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '加载个人信息失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const user = await authApi.updateProfile({
        email: email.trim(),
        phone: phone.trim(),
      });
      setEmail(String(user?.email || ''));
      setPhone(String(user?.phone || ''));
      setMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '更新失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: '请输入当前密码' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少为6位' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: '密码修改成功，请重新登录' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '密码修改失败' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="个人中心" subtitle="维护邮箱、手机号与登录密码">
      <div className="max-w-3xl space-y-4 text-sm">
        <div className="border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-900 text-white">
              {username ? username.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{username || '-'}</div>
              <div className="text-xs text-slate-500">{email || '未设置邮箱'}</div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 text-sm ${activeTab === 'info' ? 'border-b-2 border-[#1A5CFF] font-semibold text-[#1A5CFF]' : 'text-slate-600'}`}
            >
              个人信息
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-3 text-sm ${activeTab === 'password' ? 'border-b-2 border-[#1A5CFF] font-semibold text-[#1A5CFF]' : 'text-slate-600'}`}
            >
              修改密码
            </button>
          </div>

          <div className="p-4">
            {message && (
              <div className={`mb-4 flex items-start gap-2 border px-3 py-2 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            {loading ? (
              <div className="py-6 text-slate-400">加载中...</div>
            ) : activeTab === 'info' ? (
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <div>
                  <label className="ui-label">用户名</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input className="ui-input pl-9" value={username} disabled />
                  </div>
                </div>
                <div>
                  <label className="ui-label">邮箱</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      className="ui-input pl-9"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>
                <div>
                  <label className="ui-label">手机号</label>
                  <input
                    className="ui-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="pt-2">
                  <button className="ui-btn ui-btn-primary" type="submit" disabled={submitting}>
                    <Save size={14} className="mr-1" />
                    {submitting ? '保存中...' : '保存信息'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="ui-label">当前密码</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      className="ui-input pl-9"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="请输入当前密码"
                    />
                  </div>
                </div>
                <div>
                  <label className="ui-label">新密码</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      className="ui-input pl-9"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                </div>
                <div>
                  <label className="ui-label">确认新密码</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      className="ui-input pl-9"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button className="ui-btn ui-btn-primary" type="submit" disabled={submitting}>
                    <Lock size={14} className="mr-1" />
                    {submitting ? '提交中...' : '修改密码'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
