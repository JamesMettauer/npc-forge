import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Exchange from './Exchange';
import EarlierExchanges from './EarlierExchanges';
import CheckWorkflow from './CheckWorkflow';

const groupExchanges = (messages) => {
  const out = [];
  let cur = null;
  for (const m of messages) {
    if (m.role === 'user') {
      if (cur) out.push(cur);
      cur = { id: m.id, user: m, replies: [] };
    } else {
      if (!cur) cur = { id: m.id, user: null, replies: [] };
      cur.replies.push(m);
    }
  }
  if (cur) out.push(cur);
  return out;
};

const groupChecksByExchange = (checks) => {
  const map = {};
  for (const c of checks || []) {
    const key = c.exchange_id || c.id;
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }
  return map;
};

export default function ChatPanel({ messages, onSend, busy, npcName, error, errorDetail, onRegenerate, text, onText, npc, convo, onOpenNpcCheck, allChecks, onApply, onUndoApply, onFollowUp, onAddNote }){
  const [showJump, setShowJump] = useState(false);

  const exchanges = groupExchanges(messages);
  const latest = exchanges.length ? exchanges[exchanges.length - 1] : null;
  const earlier = exchanges.length > 1 ? exchanges.slice(0, -1).reverse() : [];
  const recentContext = messages.slice(-8).map(m => `${m.role}: ${m.content}`).join('\n');
  const checksByExchange = groupChecksByExchange(allChecks);

  useEffect(() => {
    const onScroll = () => setShowJump(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jumpToLatest = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <CheckWorkflow npc={npc} convo={convo} busy={busy} onSend={onSend} onOpenNpcCheck={onOpenNpcCheck} text={text} onText={onText} recentContext={recentContext}/>
      </div>
      <div className="space-y-4 p-5">
        {latest ? (
          <Exchange exchange={latest} isLatest busy={busy} npcName={npcName} error={error} errorDetail={errorDetail} onRegenerate={onRegenerate} checks={checksByExchange[latest.id]} onApply={onApply} onUndoApply={onUndoApply} onFollowUp={onFollowUp} onAddNote={onAddNote}/>
        ) : (
          <p className="text-sm text-muted-foreground">Begin the conversation. The NPC will respond in character.</p>
        )}
        {earlier.length > 0 && <EarlierExchanges exchanges={earlier} checksByExchange={checksByExchange} npcName={npcName} onApply={onApply} onUndoApply={onUndoApply} onFollowUp={onFollowUp} onAddNote={onAddNote}/>}
      </div>
      {showJump && (
        <button onClick={jumpToLatest} className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground shadow-lg"><ArrowUp size={14}/>Jump to Latest</button>
      )}
    </div>
  );
}