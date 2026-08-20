import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Shared event so only one persistent dropdown is open at a time. When a
// dropdown opens it broadcasts its id; any other open dropdown closes.
const OPEN_EVENT = 'cc-persistent-dropdown-open';

// Presentation-only groupings for the Campaign Role board. The stored
// value is the bare role string — no new fields are introduced.
const GROUPS = [
  { title: 'Relationship', roles: ['Ally', 'Enemy', 'Neutral', 'Companion', 'Rival'] },
  { title: 'Character Function', roles: ['Quest Giver', 'Informant', 'Merchant', 'Authority Figure', 'Faction Agent', 'Witness', 'Suspect', 'Local Expert'] },
  { title: 'Story Presence', roles: ['Recurring NPC', 'Minor Background NPC', 'Major Story NPC'] },
  { title: 'Special', roles: ['Villain', 'Custom Role'] },
];

// Flat order for keyboard arrow navigation (matches GROUPS order).
const ALL_ROLES = GROUPS.flatMap((g) => g.roles);

export default function PersistentRoleDropdown({ value, onChange, placeholder = 'Choose…' }) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const triggerRef = useRef(null);
  const tileRefs = useRef([]);
  const uid = useId();

  // Close when another persistent dropdown opens.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.detail !== uid) setOpen(false); };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, [open, uid]);

  // Move DOM focus to the tile at focusIndex whenever it changes.
  useEffect(() => {
    if (!open) return;
    tileRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  const openList = () => {
    setOpen(true);
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: uid }));
    const idx = ALL_ROLES.indexOf(value);
    setFocusIndex(idx >= 0 ? idx + 1 : 0); // +1 because index 0 is the clear tile
  };
  const closeList = () => { setOpen(false); setFocusIndex(-1); triggerRef.current?.focus(); };
  const toggle = () => (open ? closeList() : openList());
  const choose = (opt) => { onChange(opt); closeList(); };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); openList(); }
      return;
    }
    switch (e.key) {
      case 'Escape': e.preventDefault(); closeList(); break;
      case 'ArrowDown': case 'ArrowRight': e.preventDefault(); setFocusIndex((i) => Math.min(i + 1, ALL_ROLES.length)); break;
      case 'ArrowUp': case 'ArrowLeft': e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)); break;
      default: break;
    }
  };

  const tileCls = (role, centered = false) => {
    const selected = role === value;
    return `flex items-center ${centered ? 'justify-center' : ''} gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors outline-none focus:ring-2 focus:ring-ring/40 ${
      selected
        ? 'border-brand bg-brand/10 text-brand font-medium'
        : 'border-border bg-card text-foreground hover:border-brand/40 hover:bg-muted'
    }`;
  };

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-border bg-input px-3 py-2 text-left text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-ring/30"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1 w-[min(580px,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 shadow-xl">
          <button
            ref={(el) => (tileRefs.current[0] = el)}
            type="button"
            onClick={() => choose('')}
            className={`mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors outline-none focus:ring-2 focus:ring-ring/40 ${
              !value
                ? 'border-brand bg-brand/10 text-brand font-medium'
                : 'border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-foreground'
            }`}
          >
            {!value && <Check size={12} className="text-brand"/>}
            {value ? 'Clear selection' : placeholder}
          </button>
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-[5fr_8fr] items-start">
            {GROUPS.map((g) => {
              const centered = g.title === 'Relationship';
              const chipLayout = centered ? 'grid grid-cols-3 gap-1.5' : 'flex flex-wrap gap-1.5';
              return (
                <div key={g.title}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand/70">{g.title}</p>
                  <div className={chipLayout}>
                    {g.roles.map((role) => {
                      const idx = ALL_ROLES.indexOf(role) + 1;
                      return (
                        <button
                          key={role}
                          ref={(el) => (tileRefs.current[idx] = el)}
                          type="button"
                          role="option"
                          aria-selected={role === value}
                          onClick={() => choose(role)}
                          className={tileCls(role, centered)}
                        >
                          {role === value && <Check size={12} className="text-brand"/>}
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}