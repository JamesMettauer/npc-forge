import { Link } from 'react-router-dom';
import { AlertCircle, Mail, FileText, Clock, Bell, Check } from 'lucide-react';

const PRIORITY_META = {
  urgent: { label: 'Urgent', seal: '#9a2a2a', icon: AlertCircle, pulse: true },
  needs_review: { label: 'Needs Review', seal: '#b08d57', icon: Mail, pulse: false },
  informational: { label: 'Informational', seal: '#5a6a8a', icon: Bell, pulse: false },
};

const TYPE_ICON = { profile_updates: AlertCircle, summary: FileText, info: Bell, onboarding: Mail };

export default function DMAttention({ items, dismissed, snoozed, onSnooze, onResolve, theme, styles }) {
  const visible = items.filter((i) => !dismissed.includes(i.id) && !snoozed.includes(i.id));
  const urgent = visible.filter((i) => i.priority === 'urgent');
  const review = visible.filter((i) => i.priority === 'needs_review');
  const info = visible.filter((i) => i.priority === 'informational');
  const count = visible.length;

  const renderLetter = (item) => {
    const meta = PRIORITY_META[item.priority];
    const Icon = TYPE_ICON[item.type] || meta.icon;
    return (
      <div key={item.id} className="relative rounded-lg p-3" style={{ ...styles.panel, backgroundImage: 'linear-gradient(180deg, #f3e6c8, #e8d6ad)' }}>
        <span className="absolute -left-1 top-3 h-4 w-4 rounded-full" style={{ background: meta.seal, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} aria-hidden />
        <div className="flex items-start gap-2 pl-2">
          <Icon size={16} className={`mt-0.5 shrink-0 ${meta.pulse ? 'desk-pulse-urgent' : ''}`} style={{ color: meta.seal }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight" style={{ color: theme.ink }}>{item.title}</p>
            <p className="mt-0.5 text-xs leading-snug" style={{ color: theme.muted }}>{item.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Link to={item.to} className="rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}>{item.actionLabel}</Link>
              <button onClick={() => onSnooze(item.id)} className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs" style={{ borderColor: theme.panelBorder, color: theme.muted }}><Clock size={11}/>Snooze</button>
              <button onClick={() => onResolve(item.id)} className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs" style={{ borderColor: theme.panelBorder, color: theme.muted }}><Check size={11}/>Resolve</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section aria-label="DM Attention" className="rounded-xl p-4" style={styles.panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}>
          <AlertCircle size={18} style={{ color: theme.accent }} /> DM Attention
        </h2>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={styles.accentBtn}>{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm" style={{ color: theme.muted }}>No urgent items. Your desk is clear.</p>
      ) : (
        <div className="space-y-3">
          {urgent.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: urgent[0] && PRIORITY_META.urgent.seal }}>Urgent</p>{urgent.map(renderLetter)}</div>}
          {review.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Needs Review</p>{review.map(renderLetter)}</div>}
          {info.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Informational</p>{info.map(renderLetter)}</div>}
        </div>
      )}
    </section>
  );
}