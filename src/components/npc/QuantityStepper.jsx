import { useState, useRef, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

const PRESETS = [1, 2, 3, 4, 5, 10];
const CLOSE_DELAY = 500;

export default function QuantityStepper({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);
  const closeTimer = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);

  const open = useCallback(() => {
    cancelClose();
    setExpanded(true);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setExpanded(false), CLOSE_DELAY);
  }, [cancelClose]);

  const commit = useCallback((raw) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1) { setDraft(String(value)); return; }
    onChange(n);
    setDraft(String(n));
  }, [value, onChange]);

  const inc = () => { const n = value + 1; onChange(n); setDraft(String(n)); };
  const dec = () => { if (value > 1) { const n = value - 1; onChange(n); setDraft(String(n)); } };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); inc(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (value > 1) { const n = value - 1; onChange(n); setDraft(String(n)); } }
    else if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.blur(); commit(draft); }
  };

  const onWheel = (e) => e.preventDefault();

  return (
    <div
      className="mt-1.5"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onFocus={open}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) scheduleClose(); }}
    >
      <div className="flex items-stretch gap-1.5 rounded-lg border bg-input transition-colors border-border focus-within:border-brand/50">
        <button
          type="button"
          onClick={dec}
          disabled={value <= 1}
          aria-label="Decrease quantity"
          className="flex w-9 shrink-0 items-center justify-center rounded-l-lg border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Minus size={16}/>
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9]/g, '');
            setDraft(cleaned);
            const n = parseInt(cleaned, 10);
            if (!isNaN(n) && n >= 1) onChange(n);
          }}
          onBlur={() => commit(draft)}
          onFocus={(e) => { open(); e.target.select(); }}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
          className="w-full min-w-0 bg-transparent py-2 text-center text-sm font-semibold text-foreground outline-none"
          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
        />
        <button
          type="button"
          onClick={inc}
          aria-label="Increase quantity"
          className="flex w-9 shrink-0 items-center justify-center rounded-r-lg border-l border-border text-foreground transition-colors hover:bg-muted"
        >
          <Plus size={16}/>
        </button>
      </div>
      <div className="min-h-[22px]">
        {expanded && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Quick:</span>
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { onChange(p); setDraft(String(p)); }}
                className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${value === p ? 'border-brand bg-brand/15 text-brand' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}