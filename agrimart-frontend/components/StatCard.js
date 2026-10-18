'use client';

export default function StatCard({ value, label, tone = 'ink' }) {
  const tones = {
    ink: 'text-ink',
    primary: 'text-primary',
    danger: 'text-danger',
  };
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border bg-card px-3 py-5 shadow-sm">
      <span className={`text-2xl font-semibold tracking-tight ${tones[tone] || tones.ink}`}>{value}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
