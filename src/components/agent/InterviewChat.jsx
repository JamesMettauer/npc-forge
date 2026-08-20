import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';
import AgentMessageBubble from './AgentMessageBubble';

const AGENT_NAME = 'personality_interviewer';

export default function InterviewChat() {
  const [agentConv, setAgentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([]); setBusy(true); setError('');
    base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: 'NPC Personality Interview' }
    }).then((c) => {
      if (cancelled) return;
      setAgentConv(c);
      setMessages(c.messages || []);
      setBusy(false);
    }).catch(() => { if (!cancelled) { setError('Could not start the interview.'); setBusy(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!agentConv) return;
    const unsubscribe = base44.agents.subscribeToConversation(agentConv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      if (last && last.role !== 'user') setBusy(false);
    });
    return () => unsubscribe();
  }, [agentConv]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !agentConv || busy) return;
    setInput(''); setBusy(true);
    try {
      await base44.agents.addMessage(agentConv, { role: 'user', content: text });
    } catch {
      setError('Message failed to send.');
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-15rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-background p-4">
        {messages.length === 0 && !busy && <p className="text-sm text-muted-foreground">Starting your interview…</p>}
        {messages.map((m, i) => <AgentMessageBubble key={i} message={m}/>)}
        {busy && <p className="text-xs text-muted-foreground italic">The interviewer is thinking…</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Answer the interviewer…"
          className="flex-1 rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-brand/50"
        />
        <button onClick={send} disabled={busy || !input.trim()} className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-foreground disabled:opacity-40">
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}