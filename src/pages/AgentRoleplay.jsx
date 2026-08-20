import { useState } from 'react';
import NavControls from '@/components/NavControls';
import PageHeader from '@/components/PageHeader';
import ConversationPicker from '@/components/agent/ConversationPicker';
import AgentChat from '@/components/agent/AgentChat';

export default function AgentRoleplay() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="p-5 sm:p-8">
      <NavControls/>
      <PageHeader eyebrow="AI facilitator" title="Agent-Facilitated Roleplay"/>
      {selected ? (
        <AgentChat conversation={selected} onExit={() => setSelected(null)}/>
      ) : (
        <div className="mt-2">
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Pick an active conversation and the roleplay facilitator will take over the scene — staying in character as the NPC, tracking trust and revealed secrets, and logging each exchange.
          </p>
          <ConversationPicker onPick={setSelected}/>
        </div>
      )}
    </div>
  );
}