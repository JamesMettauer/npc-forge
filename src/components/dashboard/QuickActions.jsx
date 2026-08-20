import { Link } from 'react-router-dom';
import { Dices, FileText, CalendarPlus, ScrollText, Library, ClipboardList, Wand2, UserPlus } from 'lucide-react';

export default function QuickActions({ onInvite, onDice, theme, styles }) {
  const actions = [
    { label: 'Create NPC', icon: Wand2, to: '/create', desc: 'Blank character card' },
    { label: 'NPC Library', icon: Library, to: '/library', desc: 'Browse all NPCs' },
    { label: 'Invite Player', icon: UserPlus, onClick: onInvite, desc: 'Send a messenger' },
    { label: 'Dice Roller', icon: Dices, onClick: onDice, desc: 'Open the dice tower' },
    { label: 'Campaign Notes', icon: ScrollText, to: '/campaigns', desc: 'Quill and ink' },
    { label: 'Create Session', icon: CalendarPlus, to: '/campaigns', desc: 'Blank contract' },
    { label: 'Preparation', icon: ClipboardList, to: '/campaigns', desc: 'Ledger bookmarks' },
    { label: 'Import Sheet', icon: FileText, to: '/campaigns', desc: 'Desk drawer' },
  ];

  return (
    <section aria-label="Desk tools" className="rounded-xl p-4" style={styles.panel}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}><Wand2 size={18} style={{ color: theme.accent }} /> Desk Tools</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Inner = (
            <>
              <a.icon size={16} style={{ color: theme.accent }} />
              <span className="text-xs font-semibold leading-tight" style={{ color: theme.ink }}>{a.label}</span>
              <span className="text-[10px] leading-tight" style={{ color: theme.muted }}>{a.desc}</span>
            </>
          );
          const cls = "flex flex-col items-center gap-1 rounded-lg p-2.5 text-center transition hover:scale-[1.03]";
          const style = { background: 'rgba(0,0,0,0.06)', border: `1px solid ${theme.panelBorder}` };
          return a.to ? (
            <Link key={a.label} to={a.to} className={cls} style={style} title={a.label}>{Inner}</Link>
          ) : (
            <button key={a.label} onClick={a.onClick} className={cls} style={style} title={a.label}>{Inner}</button>
          );
        })}
      </div>
    </section>
  );
}