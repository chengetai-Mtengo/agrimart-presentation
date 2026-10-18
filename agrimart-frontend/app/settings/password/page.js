'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/Fields';
import { ErrorNote } from '@/components/Spinner';

function ChangePasswordContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.changePassword(form);
      setSuccess('Password changed successfully.');
      setTimeout(() => router.replace('/settings'), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell nav={false} width="narrow">
      <TopBar title="Change Password" />
      <form onSubmit={handleSubmit} className="mx-4 rounded-xl border bg-card p-5 shadow-sm md:mx-0 md:p-6">
        <ErrorNote message={error} />
        {success && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {success}
          </div>
        )}

        <Field label="Current Password" required>
          <TextInput
            type="password"
            value={form.currentPassword}
            onChange={(e) => update('currentPassword', e.target.value)}
            required
          />
        </Field>
        <Field label="New Password" required hint="At least 6 characters">
          <TextInput
            type="password"
            value={form.newPassword}
            onChange={(e) => update('newPassword', e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm New Password" required>
          <TextInput
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            required
          />
        </Field>

        <Button type="submit" loading={loading} className="mt-2">
          Update Password
        </Button>
      </form>
    </AppShell>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordContent />
    </ProtectedRoute>
  );
}
