import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function TextCombobox({ value, onChange, suggestions = [], placeholder = 'Search or enter…' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = draft.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(draft.toLowerCase()))
    : suggestions;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={draft}
          onChange={e => { setDraft(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-brand/50"
          placeholder={placeholder}
        />
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setDraft(s); setOpen(false); }}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-muted ${s === value ? 'font-medium text-brand' : 'text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}