import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UPDATE_MODES } from '@/lib/profileFields';
import ProfileUpdateItem from './ProfileUpdateItem';

export default function ProfileUpdatesPanel({ convo, onModeChange, onAccept, onReject, onEdit, onTemporary, onNote, onApplyAllSafe, onRejectAll }){
  const pending = (convo?.pending_updates || []).filter((u) => u.status === 'pending');
  const mode = convo?.profile_update_mode || 'auto_fill';
  return (
    <section>
      <h2 className="mb-3 font-serif text-lg">Profile updates from conversation</h2>
      <label className="block text-xs text-muted-foreground">Conversation Profile Updates</label>
      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger className="mt-1 w-full"><SelectValue/></SelectTrigger>
        <SelectContent>{UPDATE_MODES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
      </Select>
      {pending.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No pending updates. New details the NPC reveals about itself will appear here for review.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={onApplyAllSafe} className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">Apply all safe</button>
            <button onClick={onRejectAll} className="rounded-lg border border-border px-3 py-1 text-xs">Reject all</button>
          </div>
          {pending.map((u) => (
            <ProfileUpdateItem key={u.id} update={u} onAccept={onAccept} onReject={onReject} onEdit={onEdit} onTemporary={onTemporary} onNote={onNote}/>
          ))}
        </div>
      )}
    </section>
  );
}