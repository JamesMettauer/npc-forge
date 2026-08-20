import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${isUser ? 'bg-brand text-brand-foreground' : 'bg-muted text-foreground'}`}>
        {isUser ? <User size={15}/> : <Bot size={15}/>}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-brand text-brand-foreground' : 'bg-card border border-border'}`}>
        {message.content ? (
          isUser ? <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            : <ReactMarkdown className="prose prose-sm max-w-none text-sm">{message.content}</ReactMarkdown>
        ) : <p className="text-xs text-muted-foreground italic">…</p>}
      </div>
    </div>
  );
}