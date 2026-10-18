'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Spinner from '@/components/Spinner';
import { ErrorNote } from '@/components/Spinner';
import { Switch } from '@/components/ui/switch';

const TOGGLES = [
  { key: 'email_notifications', label: 'Email Notifications', hint: 'Order and listing updates by email' },
  { key: 'push_notifications', label: 'Push Notifications', hint: 'Alerts on this device' },
  { key: 'sms_notifications', label: 'SMS Notifications', hint: 'Text messages for important updates' },
  {
    key: 'price_predictions_enabled',
    label: 'Price Predictions',
    hint: 'Enable AI price trend estimates',
  },
];

function Toggle({ on, onChange, label }) {
  return <Switch checked={on} onCheckedChange={onChange} aria-label={label} />;
}

function NotificationsContent() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getNotifications()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(true);
    try {
      const result = await api.updateNotifications({ [key]: updated[key] });
      setSettings((prev) => ({ ...prev, ...result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell nav={false} width="narrow">
      <TopBar title="Notifications" />
      <div className="px-4 pb-6 md:px-0">
        <ErrorNote message={error} />
        {loading || !settings ? (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-card shadow-sm">
            {TOGGLES.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-4 py-4">
                <span className="pr-4">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </span>
                <Toggle on={!!settings[item.key]} onChange={() => toggle(item.key)} label={item.label} />
              </div>
            ))}
          </div>
        )}
        {saving && <p className="mt-3 text-center text-[12px] text-muted-foreground">Saving…</p>}
      </div>
    </AppShell>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
