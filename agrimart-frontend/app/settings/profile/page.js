'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { Field, TextInput, Select } from '@/components/Fields';
import { ErrorNote } from '@/components/Spinner';
import { PROVINCES } from '@/lib/categories';
import { Camera } from 'lucide-react';

function EditProfileContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    location: user.location || '',
    province: user.province || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Photo upload is a separate endpoint from the text-field update
      // (POST /api/users/profile-picture vs PUT /api/users/profile), so
      // they're sent as two requests when a new photo was picked.
      if (photoFile) {
        const fd = new FormData();
        fd.append('profilePicture', photoFile);
        await api.uploadProfilePicture(fd);
      }

      await api.updateProfile(form);
      await refreshUser();
      setSuccess('Profile updated.');
      setTimeout(() => router.replace('/settings'), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell nav={false} width="narrow">
      <TopBar title="Edit Profile" />
      <form onSubmit={handleSubmit} className="mx-4 rounded-xl border bg-card p-5 shadow-sm md:mx-0 md:p-6">
        <ErrorNote message={error} />
        {success && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {success}
          </div>
        )}

        <div className="mb-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative"
            aria-label="Change profile picture"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="New profile picture preview"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <Avatar src={user.profilePicture} name={user.name} size={96} className="text-[26px]" />
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] font-semibold text-primary"
          >
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            className="hidden"
            onChange={onPickPhoto}
          />
        </div>

        <Field label="Full Name" required>
          <TextInput value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </Field>
        <Field label="Phone Number" required>
          <TextInput value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
        </Field>
        <Field label="Location">
          <TextInput
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Chongwe"
          />
        </Field>
        <Field label="Province">
          <Select value={form.province} onChange={(e) => update('province', e.target.value)}>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" loading={loading} className="mt-2">
          Save Changes
        </Button>
      </form>
    </AppShell>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
