'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesAPI, authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  Settings, Building2, User, Bell, Shield, Palette, Globe,
  Moon, Sun, Monitor, Save, Key, Mail, Phone, Camera, RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'company' | 'security' | 'notifications' | 'appearance'>('profile');
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const queryClient = useQueryClient();

  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: companiesAPI.get,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: object) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Update failed'),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (data: object) => companiesAPI.update(data),
    onSuccess: () => {
      toast.success('Company settings updated!');
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: () => toast.error('Update failed'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: object) => authAPI.changePassword(data),
    onSuccess: () => toast.success('Password changed!'),
    onError: () => toast.error('Password change failed'),
  });

  const company = companyData?.data || {};
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'UTC',
    language: user?.language || 'en',
  });
  const [companyForm, setCompanyForm] = useState({
    name: company.name || '',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    address: company.address || '',
    city: company.city || '',
    country: company.country || '',
    currency: company.currency || 'USD',
    timezone: company.timezone || 'UTC',
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary-600" /> Settings
        </h1>
        <p className="page-subtitle">Manage your account, company, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-56 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id as any)} className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700')}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

            {/* Profile */}
            {tab === 'profile' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-dark-900 dark:text-white text-lg">Profile Settings</h2>
                <div className="flex items-center gap-4 pb-4 border-b border-dark-100 dark:border-dark-700">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 dark:text-white">{user?.full_name}</h3>
                    <p className="text-sm text-dark-400">{user?.email}</p>
                    <button className="btn-sm btn-secondary mt-2"><Camera className="w-3.5 h-3.5" /> Change Photo</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', key: 'first_name', icon: User },
                    { label: 'Last Name', key: 'last_name', icon: User },
                    { label: 'Phone', key: 'phone', icon: Phone },
                    { label: 'Timezone', key: 'timezone', icon: Globe },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.key}>
                        <label className="label">{f.label}</label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                          <input value={(profileForm as any)[f.key]} onChange={(e) => setProfileForm((p) => ({ ...p, [f.key]: e.target.value }))} className="input pl-9" />
                        </div>
                      </div>
                    );
                  })}
                  <div className="sm:col-span-2">
                    <label className="label">Bio</label>
                    <textarea value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} rows={3} className="input resize-none" placeholder="Tell us about yourself..." />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => updateProfileMutation.mutate(profileForm)} disabled={updateProfileMutation.isPending} className="btn-primary">
                    {updateProfileMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {/* Company */}
            {tab === 'company' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-dark-900 dark:text-white text-lg">Company Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Company Name', key: 'name' },
                    { label: 'Email', key: 'email' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Website', key: 'website' },
                    { label: 'City', key: 'city' },
                    { label: 'Country', key: 'country' },
                    { label: 'Currency', key: 'currency' },
                    { label: 'Timezone', key: 'timezone' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input value={(companyForm as any)[f.key]} onChange={(e) => setCompanyForm((p) => ({ ...p, [f.key]: e.target.value }))} className="input" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <textarea value={companyForm.address} onChange={(e) => setCompanyForm((p) => ({ ...p, address: e.target.value }))} rows={2} className="input resize-none" />
                  </div>
                </div>
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-xl">
                  <h3 className="font-medium text-dark-700 dark:text-dark-200 text-sm mb-2">Subscription Plan</h3>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-primary capitalize">{company.plan || 'Free'}</span>
                    <span className="text-sm text-dark-400">{company.user_count || 0} / {company.max_users || 5} users</span>
                    <div className="flex-1 h-2 bg-dark-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(((company.user_count || 0) / (company.max_users || 5)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => updateCompanyMutation.mutate(companyForm)} disabled={updateCompanyMutation.isPending} className="btn-primary">
                    {updateCompanyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Company
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {tab === 'security' && (
              <div className="space-y-4">
                <div className="card p-6 space-y-4">
                  <h2 className="font-semibold text-dark-900 dark:text-white text-lg">Change Password</h2>
                  {[
                    { label: 'Current Password', key: 'old_password' },
                    { label: 'New Password', key: 'new_password' },
                    { label: 'Confirm New Password', key: 'new_password_confirm' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input type="password" value={(passwordForm as any)[f.key]} onChange={(e) => setPasswordForm((p) => ({ ...p, [f.key]: e.target.value }))} className="input pl-9" />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button onClick={() => changePasswordMutation.mutate(passwordForm)} disabled={changePasswordMutation.isPending} className="btn-primary">
                      {changePasswordMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      Change Password
                    </button>
                  </div>
                </div>
                <div className="card p-6">
                  <h2 className="font-semibold text-dark-900 dark:text-white text-lg mb-4">Two-Factor Authentication</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-dark-700 dark:text-dark-200">Enable 2FA</p>
                      <p className="text-xs text-dark-400">Add an extra layer of security to your account</p>
                    </div>
                    <div className={cn('w-11 h-6 rounded-full cursor-pointer transition-colors', user?.is_2fa_enabled ? 'bg-primary-600' : 'bg-dark-200 dark:bg-dark-600')}>
                      <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-transform m-0.5', user?.is_2fa_enabled ? 'translate-x-5' : 'translate-x-0')} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {tab === 'notifications' && (
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-dark-900 dark:text-white text-lg">Notification Preferences</h2>
                {[
                  { label: 'Email Notifications', desc: 'Receive email alerts for important events' },
                  { label: 'Push Notifications', desc: 'Browser push notifications' },
                  { label: 'SMS Notifications', desc: 'SMS alerts for critical events' },
                  { label: 'New Invoice', desc: 'Notify when a new invoice is created' },
                  { label: 'Payment Received', desc: 'Notify on successful payments' },
                  { label: 'New Ticket', desc: 'Notify on new support tickets' },
                  { label: 'Task Assignment', desc: 'Notify when a task is assigned to you' },
                  { label: 'Leave Approval', desc: 'Notify on leave request decisions' },
                  { label: 'Low Stock Alert', desc: 'Notify when inventory is low' },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-dark-700 dark:text-dark-200">{pref.label}</p>
                      <p className="text-xs text-dark-400">{pref.desc}</p>
                    </div>
                    <div className="w-11 h-6 bg-primary-600 rounded-full cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-5 m-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Appearance */}
            {tab === 'appearance' && (
              <div className="card p-6 space-y-6">
                <h2 className="font-semibold text-dark-900 dark:text-white text-lg">Appearance</h2>
                <div>
                  <label className="label mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => setTheme(t.id as any)} className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all', theme === t.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-dark-200 dark:border-dark-600 hover:border-dark-300')}>
                          <Icon className={cn('w-6 h-6', theme === t.id ? 'text-primary-600' : 'text-dark-400')} />
                          <span className={cn('text-sm font-medium', theme === t.id ? 'text-primary-700 dark:text-primary-400' : 'text-dark-600 dark:text-dark-300')}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
