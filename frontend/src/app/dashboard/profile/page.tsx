'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { User, Mail, Phone, Shield, Clock, MapPin, Camera, Save, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'UTC',
    language: user?.language || 'en',
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data);
      toast.success('Profile updated successfully!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700',
    company_admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    employee: 'bg-green-100 text-green-700',
    support_agent: 'bg-orange-100 text-orange-700',
    accountant: 'bg-yellow-100 text-yellow-700',
    customer: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and preferences</p>
      </div>

      {/* Profile Header Card */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shadow-glow-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <button className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded-lg shadow-sm hover:bg-dark-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-dark-500" />
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-dark-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
              <span className={cn('badge capitalize', roleColors[user?.role || ''] || 'badge-gray')}>
                {user?.role?.replace('_', ' ')}
              </span>
              {user?.is_email_verified && (
                <span className="badge badge-success">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-dark-400 justify-center sm:justify-start">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{user?.timezone}</span>
              {user?.last_login_at && (
                <span>Last login: {new Date(user.last_login_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {user?.company_name && (
            <div className="card p-3 text-center bg-dark-50 dark:bg-dark-800">
              <div className="text-xs text-dark-400 mb-1">Company</div>
              <div className="font-semibold text-dark-800 dark:text-dark-100 text-sm">{user.company_name}</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Form */}
      <motion.div className="card p-6 space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-semibold text-dark-900 dark:text-white">Edit Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} className="input pl-9" placeholder="First name" />
            </div>
          </div>
          <div>
            <label className="label">Last Name</label>
            <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} className="input" placeholder="Last name" />
          </div>
          <div>
            <label className="label">Email (cannot change)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={user?.email || ''} disabled className="input pl-9 opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input pl-9" placeholder="+1 234 567 890" />
            </div>
          </div>
          <div>
            <label className="label">Timezone</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <select value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} className="input pl-9">
                {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Singapore', 'Australia/Sydney'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Language</label>
            <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className="input">
              <option value="en">English</option>
              <option value="bn">Bengali</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="input resize-none"
              placeholder="Tell others a bit about yourself..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {[
          { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-' },
          { label: 'Email Status', value: user?.is_email_verified ? 'Verified' : 'Not Verified' },
          { label: '2FA', value: user?.is_2fa_enabled ? 'Enabled' : 'Disabled' },
          { label: 'Role', value: user?.role?.replace('_', ' ') || '-' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-sm font-semibold text-dark-900 dark:text-white capitalize">{s.value}</div>
            <div className="text-xs text-dark-400 mt-1">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
