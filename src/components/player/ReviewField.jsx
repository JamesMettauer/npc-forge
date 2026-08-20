import { CONFIDENCE_STATES } from '@/lib/characterImport';

export default function ReviewField({ label, value, confidence, onChange, onIgnore, changed }){
  const conf = CONFIDENCE_STATES[confidence] || CONFIDENCE_STATES.needs_review;
  const isEmpty = value == null || value === '';
  return (
    <div className={`flex items-center gap-2 rounded-lg border bg-card p-2 ${changed ? 'border-brand/40 bg-brand/5' : 'border-border'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <input
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={isEmpty ? 'Not found' : ''}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${conf.badge}`}>{conf.label}</span>
      {onIgnore && <button onClick={onIgnore} className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground">Ignore</button>}
    </div>
  );
}