import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Save, History } from 'lucide-react';
import { saveDefaultSnapshot, createBackup, resetConversationOnly, resetMoodRelationship, resetLearnedDetails, resetPortraitScene, completeReset, restoreBackup } from '@/lib/npcReset';

const SCOPES = [
  { id: 'conversation', label: 'Reset Current Conversation Only', desc: 'Clears the most recent conversation history and session notes. The permanent NPC profile remains unchanged.' },
  { id: 'mood', label: 'Reset Mood and Relationship State', desc: 'Returns emotional indicators and relationship scores to their default neutral values.' },
  { id: 'learned', label: 'Reset Learned Details', desc: 'Clears learned information, revealed secrets, and pending profile updates. Baseline profile information remains.' },
  { id: 'portrait', label: 'Reset Portrait and Scene State', desc: 'Restores the baseline portrait and clears the current scene and mood.' },
  { id: 'complete', label: 'Complete Reset to Default Profile', desc: 'Restores the saved default profile and clears all roleplay-derived information.' },
];

export default function ResetDialog({ npc, open, onOpenChange, onDone }){
  const [scope, setScope] = useState('conversation');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const hasSnapshot = !!npc?.default_snapshot;
  const backups = npc?.profile_backups || [];

  const run = async (withBackup) => {
    setBusy(true); setMsg('');
    try {
      if (scope === 'complete') {
        if (!hasSnapshot) { setMsg('Save the current profile as default first to enable Complete Reset.'); setBusy(false); return; }
        if (withBackup) await createBackup(npc, 'complete', 'DM');
        await completeReset(npc);
        setMsg('NPC restored to its default state.');
      } else if (scope === 'conversation') {
        await resetConversationOnly(npc); setMsg('Current conversation reset.');
      } else if (scope === 'mood') {
        await resetMoodRelationship(npc); setMsg('Mood and relationship state reset.');
      } else if (scope === 'learned') {
        await resetLearnedDetails(npc); setMsg('Learned details cleared.');
      } else if (scope === 'portrait') {
        await resetPortraitScene(npc); setMsg('Portrait and scene state reset.');
      }
      onDone?.();
    } catch {
      setMsg('The NPC could not be reset. Its previous state has been restored.');
    } finally {
      setBusy(false);
    }
  };

  const saveDefault = async () => {
    setBusy(true);
    try { await saveDefaultSnapshot(npc); setMsg('Current profile saved as the new default.'); onDone?.(); }
    catch { setMsg('Could not save the default snapshot.'); }
    finally { setBusy(false); }
  };

  const doRestore = async (backupId) => {
    setBusy(true);
    try { await restoreBackup(npc, backupId); setMsg('Previous snapshot restored.'); onDone?.(); }
    catch { setMsg('Could not restore the snapshot.'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RotateCcw size={18}/>Reset NPC</DialogTitle>
          <DialogDescription>Restore the NPC to a clean baseline. Existing NPCs, campaigns, and portraits are preserved.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button onClick={saveDefault} disabled={busy} variant="outline" size="sm"><Save size={14}/>Save Current Profile as New Default</Button>
          {!hasSnapshot && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">No default snapshot saved yet. Complete Reset requires a saved default. Save the current profile as default first.</p>}

          <div className="space-y-2">
            {SCOPES.map((s) => (
              <label key={s.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${scope === s.id ? 'border-brand bg-brand/5' : 'border-border'}`}>
                <input type="radio" name="resetscope" checked={scope === s.id} onChange={() => setScope(s.id)} className="mt-1"/>
                <div><p className="font-medium text-foreground">{s.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p></div>
              </label>
            ))}
          </div>

          {scope === 'complete' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-destructive"><AlertTriangle size={16}/>This action cannot be undone unless a backup is created.</p>
              <p className="mt-1 text-xs text-muted-foreground">This will remove the NPC's conversation history, learned details, emotional state, and unapproved profile changes, then restore the saved default profile.</p>
            </div>
          )}

          {msg && <p className="rounded-lg bg-muted p-2 text-sm text-foreground">{msg}</p>}

          {backups.length > 0 && (
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground"><History size={14}/>Restore Previous Snapshot</p>
              <div className="mt-2 space-y-2">
                {backups.slice().reverse().map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                    <span className="text-muted-foreground">{b.scope} · {b.by} · {b.date ? new Date(b.date).toLocaleString() : ''}</span>
                    <Button onClick={() => doRestore(b.id)} disabled={busy} variant="outline" size="sm">Restore</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={busy}>Cancel</Button>
          {scope === 'complete' ? (
            <>
              <Button onClick={() => run(true)} disabled={busy}>Create Backup and Reset</Button>
              <Button onClick={() => run(false)} disabled={busy} variant="destructive">Reset Without Backup</Button>
            </>
          ) : (
            <Button onClick={() => run(false)} disabled={busy}>Apply</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}