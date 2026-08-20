import { AlertCircle, RotateCcw, ChevronDown } from 'lucide-react';
import CheckSummary from './CheckSummary';

export default function Exchange({ exchange, isLatest, busy, npcName, error, errorDetail, onRegenerate, checks, onApply, onUndoApply, onFollowUp, onAddNote, collapsible, open, onToggle }){
  const { user, replies } = exchange;
  const body = (
    <div className="space-y-3">
      {user && (
        <div className="ml-auto max-w-[85%]">
          {user.kind === 'action' ? (
            <div className="rounded-r-lg border-l-2 border-brand/60 bg-brand/5 px-4 py-2.5 text-sm italic leading-6 text-muted-foreground">
              <span className="mr-1 not-italic text-brand/70">✦</span>{user.content}
            </div>
          ) : (
            <div className="rounded-2xl bg-brand px-4 py-3 text-sm leading-6 text-brand-foreground">{user.content}</div>
          )}
        </div>
      )}
      {checks?.map(r => (
        <CheckSummary key={r.id} result={r} npcName={npcName} onApply={onApply} onUndoApply={onUndoApply} onFollowUp={onFollowUp} onAddNote={onAddNote}/>
      ))}
      {replies.map((r) => {
        const isActionOnly = !r.content && r.action;
        return (
          <div key={r.id} className="max-w-[85%]">
            {r.action && (
              <div className="rounded-l-lg border-r-2 border-muted-foreground/40 bg-muted/40 px-4 py-2.5 text-sm italic leading-6 text-muted-foreground">
                <span className="mr-1 not-italic text-muted-foreground/60">✦</span>{r.action}
              </div>
            )}
            {r.content && (
              <div className={`${isActionOnly ? 'mt-1' : ''} rounded-2xl bg-muted px-4 py-3 text-sm leading-6 text-foreground`}>{r.content}</div>
            )}
            {r.thoughts && (
              <details className="mt-2 text-xs text-purple-700 dark:text-purple-300/80">
                <summary className="cursor-pointer">NPC Thoughts · DM only</summary>
                <p className="mt-1 rounded-lg bg-purple-500/10 p-2 leading-5">{r.thoughts}</p>
              </details>
            )}
          </div>
        );
      })}
      {isLatest && busy && replies.length === 0 && (
        <p className="text-sm text-muted-foreground">{npcName || 'The NPC'} is considering a response…</p>
      )}
      {isLatest && error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle size={16}/>The NPC could not respond. Please try again.</div>
            {errorDetail && <p className="text-xs text-muted-foreground break-words">{errorDetail}</p>}
          </div>
          <button onClick={onRegenerate} className="mt-3 flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive"><RotateCcw size={12}/>Regenerate Response</button>
        </div>
      )}
    </div>
  );

  if (!collapsible) return body;

  return (
    <div className="rounded-xl border border-border">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm text-muted-foreground hover:text-foreground">
        <span className="truncate">{user ? user.content : 'NPC exchange'}{user && user.content.length > 80 ? '…' : ''}</span>
        <ChevronDown size={16} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && <div className="border-t border-border p-3">{body}</div>}
    </div>
  );
}